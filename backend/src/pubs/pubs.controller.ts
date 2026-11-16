import {
  Controller,
  Get,
  Post,
  Put,
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
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';

@Controller('pubs')
export class PubsController {
  constructor(private readonly pubsService: PubsService) {}

  @Post('publicar')
  @UseGuards(AuthGuard)
  async publicar(@Body() createDto: CreatePublicacionDto, @Req() req: any) {
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    return await this.pubsService.publicar(createDto, usuarioId);
  }

  @Delete('borrar/:id')
  @UseGuards(AuthGuard)
  async borrar(@Param('id') id: string, @Req() req: any) {
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
  async darLike(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user?.sub;
    return await this.pubsService.darLike(id, usuarioId);
  }

  @Delete('like/:id')
  @UseGuards(AuthGuard)
  async quitarLike(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user?.sub;
    return await this.pubsService.quitarLike(id, usuarioId);
  }

  @Post('publicacion/:id/comentario')
  @UseGuards(AuthGuard)
  async agregarComentario(
    @Param('id') id: string,
    @Body() createDto: CreateComentarioDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    return await this.pubsService.agregarComentario(id, createDto, usuarioId);
  }

  @Put('comentario/:id')
  @UseGuards(AuthGuard)
  async modificarComentario(
    @Param('id') id: string,
    @Body() updateDto: UpdateComentarioDto,
    @Req() req: any,
  ) {
    return await this.pubsService.modificarComentario(id, updateDto, req.user);
  }

  @Get('publicacion/:id/comentarios')
  async getComentarios(@Param('id') id: string, @Query() query: any) {
    return await this.pubsService.getComentarios(id, query);
  }
}
