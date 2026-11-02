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
import { Response } from 'express';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticationDto } from './dto/authentication.dto.js';
import { PasswordHasher } from '@nestjs/authentication';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

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
    };
    return this.jwtService.signAsync(payload, { expiresIn: '31d' });
  }

  setTokenCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true, // para evitar ataques XSS
      sameSite: 'strict', // para evitar ataques CSRF
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 31, // un mes
    });
  }
}
