import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema()
export class Usuario {
  @Prop()
  username: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  nombre: string;

  @Prop()
  apellido: string;

  @Prop()
  fechaNacimiento: string;

  @Prop()
  descripcion: string;

  @Prop()
  urlFoto: string;

  @Prop()
  rol: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
