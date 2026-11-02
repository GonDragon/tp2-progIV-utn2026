import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PubsService } from './pubs.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';

@Controller(['pubs', ''])
export class PubsController {
  constructor(private readonly pubsService: PubsService) {}

  @Post('publicar')
  @UseGuards(AuthGuard)
  async publicar(@Body() createDto: CreatePublicacionDto, @Req() req: any) {
    const usuarioId = req.user?.sub ?? req.user?.id ?? req.user?._id;
    if (!usuarioId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    return await this.pubsService.publicar(createDto, usuarioId);
  }

  @Delete('borrar/:id')
  @UseGuards(AuthGuard)
  async borrarConParam(@Param('id') id: string, @Req() req: any) {
    return await this.pubsService.borrar(id, req.user);
  }

  @Get('publicacion/:id')
  async getPublicacion(@Param('id') id: string) {
    return await this.pubsService.getPublicacion(id);
  }

  @Get('publicaciones')
  async getPublicaciones(@Query() query: any) {
    return await this.pubsService.getPublicaciones(query);
  }

  @Post('like/:id')
  @UseGuards(AuthGuard)
  async darLikeParam(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user?.sub ?? req.user?.id ?? req.user?._id;
    return await this.pubsService.darLike(id, usuarioId);
  }

  @Delete('like/:id')
  @UseGuards(AuthGuard)
  async quitarLikeParam(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user?.sub ?? req.user?.id ?? req.user?._id;
    return await this.pubsService.quitarLike(id, usuarioId);
  }
}
