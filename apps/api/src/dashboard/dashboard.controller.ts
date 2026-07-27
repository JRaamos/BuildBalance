import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('dashboard') general(@CurrentUser() user: AuthUser) { return this.service.general(user); }
  @Get('projects/:projectId/dashboard')
  project(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) { return this.service.project(user, projectId); }
}
