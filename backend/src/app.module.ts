import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { PubsModule } from './pubs/pubs.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? ''
    ),
    AuthModule,
    PubsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
