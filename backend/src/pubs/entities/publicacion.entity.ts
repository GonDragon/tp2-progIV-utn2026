import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from './../../auth/entities/usuario.entity.js'; // Ajusta la ruta según la ubicación de tu esquema

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true }) // Genera automáticamente `createdAt` y `updatedAt` tipo Date
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true })
  contenido: string;

  @Prop()
  url_imagen: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Usuario.name }],
    default: []
  })
  likes: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: Usuario.name,
    required: true,
    index: true,
  })
  autor: Types.ObjectId; // Referencia nativa de Mongoose al esquema Usuario

  @Prop({ default: false })
  eliminado: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
