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
import {
  Comentario,
  ComentarioDocument,
} from './entities/comentario.entity.js';
import { Usuario, UsuarioDocument } from '../auth/entities/usuario.entity.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';

@Injectable()
export class PubsService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
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

  async agregarComentario(
    publicacionId: string | undefined,
    createComentarioDto: CreateComentarioDto,
    usuarioId: string,
  ): Promise<Comentario> {
    const pubId = publicacionId || createComentarioDto.id_publicacion;

    if (!pubId || !Types.ObjectId.isValid(pubId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    if (!usuarioId || !Types.ObjectId.isValid(usuarioId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const publicacion = await this.publicacionModel.findById(pubId);
    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const contenido = (createComentarioDto.contenido ?? '').trim();

    if (!contenido) {
      throw new BadRequestException('El contenido del comentario es requerido');
    }

    const nuevoComentario = new this.comentarioModel({
      id_usuario: new Types.ObjectId(usuarioId),
      id_publicacion: new Types.ObjectId(pubId),
      contenido,
      modificado: false,
    });

    return await nuevoComentario.save();
  }

  async modificarComentario(
    comentarioId: string | undefined,
    updateComentarioDto: UpdateComentarioDto,
    user?: { sub?: string; id?: string; _id?: string; rol?: string },
  ): Promise<Comentario> {
    if (!comentarioId || !Types.ObjectId.isValid(comentarioId)) {
      throw new BadRequestException('ID de comentario inválido');
    }

    const comentario = await this.comentarioModel.findById(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (user) {
      const usuarioId = user.sub;
      if (usuarioId) {
        const esAutor = comentario.id_usuario.toString() === usuarioId.toString();
        const esAdmin = user.rol === 'administrador' || user.rol === 'admin';
        if (!esAutor && !esAdmin) {
          throw new ForbiddenException(
            'Solo el autor o un administrador pueden modificar este comentario',
          );
        }
      }
    }

    const nuevoContenido = (updateComentarioDto.contenido ?? '').trim();

    if (!nuevoContenido) {
      throw new BadRequestException('El contenido del comentario es requerido');
    }

    comentario.contenido = nuevoContenido;
    comentario.modificado = true;

    return await comentario.save();
  }

  async getComentarios(
    publicacionId: string | undefined,
    query?: {
      offset?: number;
      limit?: number;
      page?: number;
    },
  ): Promise<any[]> {
    if (!publicacionId || !Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findById(publicacionId);
    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    let offsetNum = Number(query?.offset);
    if (isNaN(offsetNum) && query?.page) {
      const pageNum = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Number(query?.limit) || 10);
      offsetNum = (pageNum - 1) * limit;
    }
    offsetNum = Math.max(0, offsetNum || 0);
    const limitNum = Math.max(1, Number(query?.limit) || 10);

    return await this.comentarioModel
      .find({ id_publicacion: new Types.ObjectId(publicacionId) })
      .populate('id_usuario', '-password')
      .sort({ createdAt: -1, _id: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean()
      .exec();
  }

  async cantidadPublicaciones(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    usuario?: string;
  }): Promise<{ cantidad: number }> {
    const { fecha_inicio, fecha_fin, usuario } = query;

    if (!fecha_inicio || !fecha_fin) {
      throw new BadRequestException(
        'Fecha de inicio y fecha de fin son requeridas',
      );
    }

    let startDate: Date;
    let endDate: Date;

    if (
      typeof fecha_inicio === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio.trim())
    ) {
      startDate = new Date(`${fecha_inicio.trim()}T00:00:00.000Z`);
    } else {
      startDate = new Date(fecha_inicio);
    }

    if (
      typeof fecha_fin === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha_fin.trim())
    ) {
      endDate = new Date(`${fecha_fin.trim()}T23:59:59.999Z`);
    } else {
      endDate = new Date(fecha_fin);
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Formato de fecha inválido');
    }

    const filter: Record<string, any> = {
      eliminado: { $ne: true },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (
      usuario !== undefined &&
      usuario !== null &&
      String(usuario).trim() !== ''
    ) {
      const usernameStr = String(usuario).trim();
      let userId: Types.ObjectId | null = null;
      const userDoc = await this.usuarioModel.findOne({ username: usernameStr });
      if (userDoc) {
        userId = userDoc._id;
      } else if (Types.ObjectId.isValid(usernameStr)) {
        const userById = await this.usuarioModel.findById(usernameStr);
        if (userById) {
          userId = userById._id;
        }
      }

      if (!userId) {
        return { cantidad: 0 };
      }

      filter.autor = userId;
    }

    const cantidad = await this.publicacionModel.countDocuments(filter);
    return { cantidad };
  }

  async cantidadComentarios(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    usuario?: string;
    id_publicacion?: string;
  }): Promise<{ cantidad: number }> {
    const { fecha_inicio, fecha_fin, usuario, id_publicacion } = query;

    if (!fecha_inicio || !fecha_fin) {
      throw new BadRequestException(
        'Fecha de inicio y fecha de fin son requeridas',
      );
    }

    let startDate: Date;
    let endDate: Date;

    if (
      typeof fecha_inicio === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio.trim())
    ) {
      startDate = new Date(`${fecha_inicio.trim()}T00:00:00.000Z`);
    } else {
      startDate = new Date(fecha_inicio);
    }

    if (
      typeof fecha_fin === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha_fin.trim())
    ) {
      endDate = new Date(`${fecha_fin.trim()}T23:59:59.999Z`);
    } else {
      endDate = new Date(fecha_fin);
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Formato de fecha inválido');
    }

    const filter: Record<string, any> = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (
      usuario !== undefined &&
      usuario !== null &&
      String(usuario).trim() !== ''
    ) {
      const usernameStr = String(usuario).trim();
      let userId: Types.ObjectId | null = null;
      const userDoc = await this.usuarioModel.findOne({ username: usernameStr });
      if (userDoc) {
        userId = userDoc._id;
      } else if (Types.ObjectId.isValid(usernameStr)) {
        const userById = await this.usuarioModel.findById(usernameStr);
        if (userById) {
          userId = userById._id;
        }
      }

      if (!userId) {
        return { cantidad: 0 };
      }

      filter.id_usuario = userId;
    }

    if (
      id_publicacion !== undefined &&
      id_publicacion !== null &&
      String(id_publicacion).trim() !== ''
    ) {
      const pubIdStr = String(id_publicacion).trim();
      if (!Types.ObjectId.isValid(pubIdStr)) {
        return { cantidad: 0 };
      }
      filter.id_publicacion = new Types.ObjectId(pubIdStr);
    }

    const cantidad = await this.comentarioModel.countDocuments(filter);
    return { cantidad };
  }

  async topUsuariosComentarios(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    limite?: number;
  }): Promise<{ id_usuario: string; username: string; nombre?: string; cantidad: number }[]> {
    const { fecha_inicio, fecha_fin, limite } = query;
    const filter: Record<string, any> = {};

    if (fecha_inicio && fecha_fin) {
      let startDate: Date;
      let endDate: Date;

      if (
        typeof fecha_inicio === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio.trim())
      ) {
        startDate = new Date(`${fecha_inicio.trim()}T00:00:00.000Z`);
      } else {
        startDate = new Date(fecha_inicio);
      }

      if (
        typeof fecha_fin === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha_fin.trim())
      ) {
        endDate = new Date(`${fecha_fin.trim()}T23:59:59.999Z`);
      } else {
        endDate = new Date(fecha_fin);
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Formato de fecha inválido');
      }

      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const limitNum = Math.max(1, Number(limite) || 5);

    const pipeline: any[] = [];
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    pipeline.push(
      {
        $group: {
          _id: '$id_usuario',
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { cantidad: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuarioInfo',
        },
      },
      {
        $unwind: {
          path: '$usuarioInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          id_usuario: '$_id',
          cantidad: 1,
          username: { $ifNull: ['$usuarioInfo.username', 'Desconocido'] },
          nombre: '$usuarioInfo.nombre',
        },
      },
    );

    return await this.comentarioModel.aggregate(pipeline);
  }
}
