import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({ imports: [ProjectsModule, AuditModule], controllers: [ExpensesController], providers: [ExpensesService] })
export class ExpensesModule {}
