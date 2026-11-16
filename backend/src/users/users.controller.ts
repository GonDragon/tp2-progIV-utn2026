import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AdminGuard } from '../guards/admin.guard.js';

@Controller('usuario')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll(
    @Query('cantidad') cantidad?: string,
    @Query('inicial') inicial?: string,
  ) {
    return await this.usersService.findAll(cantidad, inicial);
  }

  @Delete('deshabilitar/:username')
  @UseGuards(AdminGuard)
  async deshabilitar(@Param('username') username: string) {
    return await this.usersService.deshabilitar(username);
  }

  @Post('habilitar/:username')
  @UseGuards(AdminGuard)
  async habilitar(@Param('username') username: string) {
    return await this.usersService.habilitar(username);
  }

  @Get('id/:id')
  async findById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Get('username/:id')
  async findByUsername(@Param('id') id: string) {
    return await this.usersService.findByUsername(id);
  }
}
