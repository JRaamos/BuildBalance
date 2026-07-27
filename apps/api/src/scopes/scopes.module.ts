import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { ScopesController } from './scopes.controller';
import { ScopesService } from './scopes.service';

@Module({ imports: [ProjectsModule], controllers: [ScopesController], providers: [ScopesService], exports: [ScopesService] })
export class ScopesModule {}
