import {
  BadRequestException,
  Body,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { Request } from 'express';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticationDto } from './dto/authentication.dto.js';
import { PasswordHasher } from '@nestjs/authentication';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  extractToken(req: Request, body?: any): string | null {
    if (typeof body === 'string' && body.trim() !== '') {
      return body.trim();
    }
    if (body && typeof body.token === 'string' && body.token.trim() !== '') {
      return body.token.trim();
    }
    const authHeader = req.headers['Authorization'];
    if (typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
      }
      return authHeader.trim();
    }
    return null;
  }

  async autorizar(req: Request, body?: any) {
    const token = this.extractToken(req, body);
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      let user = null;
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
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      if (user.habilitado === false) {
        throw new UnauthorizedException('su usuario se encuentra deshabilitado');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async refrescar(req: Request, body?: any) {
    const token = this.extractToken(req, body);
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      let user = null;
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
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      if (user.habilitado === false) {
        throw new UnauthorizedException('su usuario se encuentra deshabilitado');
      }
      const { iat, exp, nbf, jti, ...cleanPayload } = payload;
      cleanPayload.habilitado = user.habilitado;
      return await this.jwtService.signAsync(cleanPayload);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async login(@Body() loginAuthDto: AuthenticationDto) {
    const user = await this.usuarioModel.findOne({
      username: loginAuthDto.username,
    });

    if (
      !user ||
      !(await this.passwordHasher.verify(loginAuthDto.password, user.password))
    ) {
      // Devuelve un HTTP 401 Unauthorized
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.habilitado === false) {
      throw new UnauthorizedException('su usuario se encuentra deshabilitado');
    }

    return this.generateToken(user);
  }

  async register(@Body() createAuthDto: CreateUsuarioDto) {
    // Opcional: Verificar si el usuario ya existe para evitar error de duplicados en la base de datos
    const existingUser = await this.usuarioModel.findOne({
      username: createAuthDto.username,
    });
    if (existingUser) {
      // Devuelve un HTTP 409 Conflict
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    createAuthDto.password = await this.passwordHasher.hash(
      createAuthDto.password,
    );

    const newUser = await this.usuarioModel.create(createAuthDto);

    if (!newUser) {
      // Devuelve un HTTP 400 Bad Request
      throw new BadRequestException('No se pudo crear el usuario');
    }

    return this.generateToken(newUser);
  }

  async getPerfil(id: string) {
    const user = await this.usuarioModel.findById(id);

    if (!user) {
      throw new Error('No se pudo obtener el perfil');
    }
    return user;
  }

  generateToken(usuario: UsuarioDocument) {
    const payload = {
      username: usuario.username,
      sub: usuario._id,
      rol: usuario.rol || 'usuario',
      habilitado: usuario.habilitado,
    };
    return this.jwtService.signAsync(payload);
  }
}
