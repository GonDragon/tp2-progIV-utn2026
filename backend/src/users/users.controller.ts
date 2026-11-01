import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('usuario')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('id/:id')
  async findById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Get('username/:id')
  async findByUsername(@Param('id') id: string) {
    return await this.usersService.findByUsername(id);
  }
}
