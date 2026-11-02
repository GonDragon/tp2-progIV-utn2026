import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.entity.js';
import { Usuario, UsuarioDocument } from '../auth/entities/usuario.entity.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';

@Injectable()
export class PubsService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async publicar(
    createPublicacionDto: CreatePublicacionDto,
    usuarioId: string,
  ): Promise<Publicacion> {
    const contenido = createPublicacionDto.contenido ?? '';
    const url_imagen = createPublicacionDto.url_imagen ?? '';

    const nuevaPublicacion = new this.publicacionModel({
      titulo: createPublicacionDto.titulo,
      contenido,
      url_imagen,
      autor: new Types.ObjectId(usuarioId),
      likes: [],
      eliminado: false,
    });

    return await nuevaPublicacion.save();
  }

  async borrar(
    publicacionId: string,
    user: { sub: string; rol?: string },
  ): Promise<Publicacion> {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const esAutor = publicacion.autor.toString() === user.sub.toString();
    const esAdmin = user.rol === 'administrador' || user.rol === 'admin';

    if (!esAutor && !esAdmin) {
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar esta publicación',
      );
    }

    publicacion.eliminado = true;
    return await publicacion.save();
  }

  async getPublicaciones(query: {
    orderBy?: string;
    autor?: string;
    offset?: number;
    limit?: number;
  }): Promise<any[]> {
    const offsetNum = Math.max(0, Number(query.offset) || 0);
    const limitNum = Math.max(1, Number(query.limit) || 10);

    const filter: Record<string, any> = {
      eliminado: { $ne: true },
    };

    // Filtrado simple por ObjectId del autor
    if (query.autor) {
      if (!Types.ObjectId.isValid(query.autor)) {
        return [];
      }
      filter.autor = new Types.ObjectId(query.autor);
    }

    // Ordenamiento por cantidad de likes utilizando Aggregation Pipeline
    if (query.orderBy === 'likes') {
      return await this.publicacionModel.aggregate([
        { $match: filter },
        {
          $addFields: {
            likes: { $size: { $ifNull: ['$likes', []] } },
          },
        },
        { $sort: { likes: -1, createdAt: -1 } },
        { $skip: offsetNum },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'autor',
            foreignField: '_id',
            as: 'autor',
          },
        },
        {
          $unwind: {
            path: '$autor',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            titulo: 1,
            contenido: 1,
            url_imagen: 1,
            createdAt: 1,
            likes: 1,
            'autor._id': 1,
            'autor.username': 1,
            'autor.nombre': 1,
            'autor.email': 1,
          },
        },
      ]);
    }

    // Ordenamiento estándar por createdAt utilizando find() + populate()
    const publicaciones = await this.publicacionModel
      .find(filter)
      .select('titulo contenido url_imagen createdAt likes autor')
      .populate('autor', '-password')
      .sort({ createdAt: -1, _id: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean()
      .exec();

    // Mapeo para reemplazar el array de likes por su longitud
    return publicaciones.map((pub) => ({
      ...pub,
      likes: Array.isArray(pub.likes) ? pub.likes.length : 0,
    }));
  }

  async getPublicacion(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel
      .findOne({ _id: id, eliminado: { $ne: true } })
      .populate('autor', '-password')
      .lean()
      .exec();

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Reemplaza el array de likes por su longitud (cantidad total de likes)
    return {
      ...publicacion,
      likes: Array.isArray(publicacion.likes) ? publicacion.likes.length : 0,
    };
  }

  async darLike(
    publicacionId: string,
    usuarioId: string,
  ): Promise<Publicacion> {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const yaDioLike = publicacion.likes.some(
      (id) => id.toString() === usuarioId.toString(),
    );

    if (yaDioLike) {
      throw new BadRequestException(
        'El usuario ya le dio me gusta a esta publicación',
      );
    }

    publicacion.likes.push(new Types.ObjectId(usuarioId) as any);
    return await publicacion.save();
  }

  async quitarLike(
    publicacionId: string,
    usuarioId: string,
  ): Promise<Publicacion> {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const yaDioLike = publicacion.likes.some(
      (id) => id.toString() === usuarioId.toString(),
    );

    if (!yaDioLike) {
      throw new BadRequestException(
        'El usuario no ha dado me gusta a esta publicación previamente',
      );
    }

    publicacion.likes = publicacion.likes.filter(
      (id) => id.toString() !== usuarioId.toString(),
    ) as any;

    return await publicacion.save();
  }
}
