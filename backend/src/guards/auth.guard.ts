import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Usuario, UsuarioDocument } from '../auth/entities/usuario.entity.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Optional()
    @InjectModel(Usuario.name)
    private readonly usuarioModel?: Model<UsuarioDocument>,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const token = this.extractTokenFromHeader(context);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      console.log(payload);

      let user: UsuarioDocument | null = null;
      if (this.usuarioModel) {
        if (payload.sub && Types.ObjectId.isValid(payload.sub)) {
          user = await this.usuarioModel
            .findById(payload.sub)
            .select('-password -__v')
            .exec();
        }
        if (!user && payload.username) {
          user = await this.usuarioModel
            .findOne({ username: payload.username })
            .select('-password -__v')
            .exec();
        }
      }

      if (user && user.habilitado === false) {
        throw new UnauthorizedException('su usuario se encuentra deshabilitado');
      }

      if (payload.habilitado === false) {
        throw new UnauthorizedException('su usuario se encuentra deshabilitado');
      }

      context.switchToHttp().getRequest().user = payload;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException();
    }
  }

  extractTokenFromHeader(context: ExecutionContext): string | null {
    const request = context.switchToHttp().getRequest();

    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    if (typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
      }
      return authHeader.trim();
    }
    return null;
  }
}
