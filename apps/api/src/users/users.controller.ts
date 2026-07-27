import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto, UserStatusDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('Usuários administrativos')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() list(@Query() query: Record<string, string | undefined>) { return this.service.list(query); }
  @Post() create(@CurrentUser() actor: AuthUser, @Body() dto: CreateUserDto) { return this.service.create(actor.id, dto); }
  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }
  @Patch(':id') update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(actor.id, id, dto);
  }
  @Patch(':id/status') status(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: UserStatusDto) {
    return this.service.setStatus(actor.id, id, dto);
  }
  @Post(':id/reset-password') reset(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(actor.id, id, dto);
  }
}
