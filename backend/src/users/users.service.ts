import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Usuario, UsuarioDocument } from '../auth/entities/usuario.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async findById(id: string): Promise<Usuario> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const usuario = await this.usuarioModel
      .findById(id)
      .select('-password -__v')
      .exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async findByUsername(username: string): Promise<Usuario> {
    const usuario = await this.usuarioModel
      .findOne({ username })
      .select('-password -__v')
      .exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async findAll(
    cantidad?: string | number,
    inicial?: string | number,
  ): Promise<Usuario[]> {
    const limit =
      cantidad !== undefined && cantidad !== '' && !isNaN(Number(cantidad))
        ? Math.max(0, Number(cantidad))
        : 10;
    const skip =
      inicial !== undefined && inicial !== '' && !isNaN(Number(inicial))
        ? Math.max(0, Number(inicial))
        : 0;

    return await this.usuarioModel
      .find()
      .select('-password -__v')
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async deshabilitar(username: string): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOne({ username });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    usuario.habilitado = false;
    return await usuario.save();
  }

  async habilitar(username: string): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOne({ username });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    usuario.habilitado = true;
    return await usuario.save();
  }
}
