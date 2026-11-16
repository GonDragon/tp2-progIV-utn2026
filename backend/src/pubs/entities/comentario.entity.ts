import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../auth/entities/usuario.entity.js';
import { Publicacion } from './publicacion.entity.js';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true })
export class Comentario {
  @Prop({
    type: Types.ObjectId,
    ref: Usuario.name,
    required: true,
    index: true,
  })
  id_usuario: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Publicacion.name,
    required: true,
    index: true,
  })
  id_publicacion: Types.ObjectId;

  @Prop({ required: true, trim: true })
  contenido: string;

  @Prop({ default: false })
  modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
