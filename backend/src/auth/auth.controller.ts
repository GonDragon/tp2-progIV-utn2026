import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { AuthenticationDto } from './dto/authentication.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async create(
    @Body() createAuthDto: CreateUsuarioDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(createAuthDto);
    this.authService.setTokenCookie(res, result);
    return result;
  }

  @Post('login')
  async login(
    @Body() loginAuthDto: AuthenticationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginAuthDto);
    this.authService.setTokenCookie(res, await result);
    return result;
  }

  @Get('perfil/:id')
  @UseGuards(AuthGuard)
  validateToken(@Param('id') id: string) {
    return this.authService.getPerfil(id);
  }
}
