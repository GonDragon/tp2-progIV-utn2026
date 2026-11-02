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
}
