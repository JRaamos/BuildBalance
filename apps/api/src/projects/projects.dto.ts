import { ProjectStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsMoneyString } from '../common/validation';

export class CreateProjectDto {
  @IsString() @MaxLength(140) name: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsMoneyString() totalBudget: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() expectedEndDate?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(140) name?: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsOptional() @IsMoneyString() totalBudget?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() expectedEndDate?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class DeleteProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  confirmation: string;
}
