import { Body, Injectable } from '@nestjs/common';
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
      throw new Error('Credenciales incorrectas');
    }

    return this.generateToken(user);
  }

  async register(@Body() createAuthDto: CreateUsuarioDto) {
    createAuthDto.password = await this.passwordHasher.hash(
      createAuthDto.password,
    );

    const newUser = await this.usuarioModel.create(createAuthDto);

    if (!newUser) {
      throw new Error('Failed to create user');
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
    const payload = { username: usuario.username, sub: usuario._id };
    return this.jwtService.signAsync(payload);
  }

  setTokenCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true, // para evitar ataques XSS
      sameSite: 'strict', // para evitar ataques CSRF
      secure: false,
      maxAge: 1000 * 20, // 20 segundos, sincronización con el token
    });
  }
}
