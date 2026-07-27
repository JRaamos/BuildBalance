import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateScopeDto, UpdateScopeDto } from './scopes.dto';
import { ScopesService } from './scopes.service';

@ApiTags('Escopos')
@ApiBearerAuth()
@Controller()
export class ScopesController {
  constructor(private readonly service: ScopesService) {}
  @Post('projects/:projectId/scopes')
  create(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: CreateScopeDto) {
    return this.service.create(user, projectId, dto);
  }
  @Get('projects/:projectId/scopes')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) { return this.service.list(user, projectId); }
  @Patch('scopes/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateScopeDto) {
    return this.service.update(user, id, dto);
  }
  @Delete('scopes/:id')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.cancel(user, id); }
}
