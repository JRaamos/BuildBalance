import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateExpenseDto, UpdateExpenseDto } from './expenses.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Gastos')
@ApiBearerAuth()
@Controller()
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}
  @Post('projects/:projectId/expenses')
  create(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: CreateExpenseDto) {
    return this.service.create(user, projectId, dto);
  }
  @Get('projects/:projectId/expenses')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Query() query: Record<string, string | undefined>) {
    return this.service.list(user, projectId, query);
  }
  @Get('expenses/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.get(user, id); }
  @Patch('expenses/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(user, id, dto);
  }
  @Delete('expenses/:id')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.cancel(user, id); }
}
