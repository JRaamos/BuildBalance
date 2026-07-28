import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateProjectDto, DeleteProjectDto, UpdateProjectDto } from './projects.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Obras')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) { return this.service.create(user, dto); }
  @Get() list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.service.list(user, query);
  }
  @Get(':id') get(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.get(user, id); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(user, id, dto);
  }
  @Patch(':id/complete') complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.complete(user, id);
  }
  @Delete(':id/permanent')
  deletePermanently(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DeleteProjectDto
  ) {
    return this.service.deletePermanently(user, id, dto);
  }
  @Delete(':id') archive(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.archive(user, id); }
}
