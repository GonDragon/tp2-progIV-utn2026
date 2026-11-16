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

  @Post(['comentario', 'comentar', 'comentarios'])
  @UseGuards(AuthGuard)
  async agregarComentario(
    @Body() createDto: CreateComentarioDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.sub ?? req.user?.id ?? req.user?._id;
    if (!usuarioId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    const publicacionId = createDto.id_publicacion;
    return await this.pubsService.agregarComentario(
      publicacionId,
      createDto,
      usuarioId,
    );
  }

  @Post([
    'comentario/:id',
    'comentar/:id',
    'comentarios/:id',
    'publicacion/:id/comentario',
    'publicacion/:id/comentarios',
  ])
  @UseGuards(AuthGuard)
  async agregarComentarioParam(
    @Param('id') id: string,
    @Body() createDto: CreateComentarioDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.sub ?? req.user?.id ?? req.user?._id;
    if (!usuarioId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    return await this.pubsService.agregarComentario(id, createDto, usuarioId);
  }

  @Put(['comentario/:id', 'comentarios/:id'])
  @UseGuards(AuthGuard)
  async modificarComentario(
    @Param('id') id: string,
    @Body() updateDto: UpdateComentarioDto,
    @Req() req: any,
  ) {
    return await this.pubsService.modificarComentario(id, updateDto, req.user);
  }

  @Put(['comentario', 'comentarios'])
  @UseGuards(AuthGuard)
  async modificarComentarioBody(
    @Body()
    updateDto: UpdateComentarioDto & {
      id?: string;
      _id?: string;
      id_comentario?: string;
      idComentario?: string;
    },
    @Req() req: any,
  ) {
    const id =
      updateDto.id ??
      updateDto._id ??
      updateDto.id_comentario ??
      updateDto.idComentario;
    return await this.pubsService.modificarComentario(id, updateDto, req.user);
  }

  @Get([
    'comentarios/:id',
    'publicacion/:id/comentarios',
    'publicacion/:id/comentario',
  ])
  async getComentarios(@Param('id') id: string, @Query() query: any) {
    return await this.pubsService.getComentarios(id, query);
  }

  @Get('comentarios')
  async getComentariosQuery(@Query() query: any) {
    const id = query.id_publicacion ?? query.id;
    return await this.pubsService.getComentarios(id, query);
  }
}
