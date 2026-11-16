import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { AuthenticationDto } from './dto/authentication.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { Request, Response } from 'express';

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
    return { token: result };
  }

  @Post('login')
  async login(
    @Body() loginAuthDto: AuthenticationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginAuthDto);
    this.authService.setTokenCookie(res, result);
    return { token: result };
  }

  @Post('autorizar')
  async autorizar(
    @Req() req: Request,
    @Body() body: any,
  ) {
    return await this.authService.autorizar(req, body);
  }

  @Post('refrescar')
  async refrescar(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refrescar(req, body);
    this.authService.setTokenCookie(res, result);
    return { token: result };
  }

  @Get('perfil/:id')
  @UseGuards(AuthGuard)
  validateToken(@Param('id') id: string) {
    return { id: this.authService.getPerfil(id) };
  }
}
