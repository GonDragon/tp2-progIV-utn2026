import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? ''
    ),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
