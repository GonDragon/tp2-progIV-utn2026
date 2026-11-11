import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { ImgModule } from './img/img.module.js';
import { PubsModule } from './pubs/pubs.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? ''
    ),
    AuthModule,
    ImgModule,
    PubsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
