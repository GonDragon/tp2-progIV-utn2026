import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubsController } from './pubs.controller.js';
import { PubsService } from './pubs.service.js';
import {
  Publicacion,
  PublicacionSchema,
} from './entities/publicacion.entity.js';
import { Usuario, UsuarioSchema } from '../auth/entities/usuario.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [PubsController],
  providers: [PubsService],
  exports: [PubsService],
})
export class PubsModule {}
