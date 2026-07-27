import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectAuthorizationService } from './project-authorization.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuditModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAuthorizationService],
  exports: [ProjectsService, ProjectAuthorizationService]
})
export class ProjectsModule {}
