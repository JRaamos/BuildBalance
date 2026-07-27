import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('financial-summary')
  async financial(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.reports.financial(user, projectId);
  }

  @Get('expenses-by-scope')
  async byScope(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.reports.byScope(user, projectId);
  }

  @Get('expenses-by-period')
  async byPeriod(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reports.byPeriod(user, projectId, startDate, endDate);
  }
}
