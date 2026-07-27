import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { AdminService } from './admin.service';
import { ChangeAccessDto, GrantAccessDto } from './admin.dto';

@ApiTags('Administração')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Get('projects/:projectId/access') projectAccess(@Param('projectId') id: string) { return this.service.projectAccess(id); }
  @Post('projects/:projectId/access')
  grant(@CurrentUser() actor: AuthUser, @Param('projectId') id: string, @Body() dto: GrantAccessDto) {
    return this.service.grant(actor.id, id, dto);
  }
  @Patch('projects/:projectId/access/:accessId')
  change(@CurrentUser() actor: AuthUser, @Param('projectId') id: string, @Param('accessId') accessId: string, @Body() dto: ChangeAccessDto) {
    return this.service.change(actor.id, id, accessId, dto);
  }
  @Delete('projects/:projectId/access/:accessId')
  remove(@CurrentUser() actor: AuthUser, @Param('projectId') id: string, @Param('accessId') accessId: string) {
    return this.service.remove(actor.id, id, accessId);
  }
  @Get('users/:userId/project-access') userAccess(@Param('userId') id: string) { return this.service.userAccess(id); }
  @Get('audit') audit(@Query() query: Record<string, string | undefined>) { return this.service.listAudit(query); }
}
