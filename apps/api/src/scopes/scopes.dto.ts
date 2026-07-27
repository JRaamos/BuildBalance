import { ScopeStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsMoneyString } from '../common/validation';

export class CreateScopeDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsMoneyString() plannedBudget: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

export class UpdateScopeDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsOptional() @IsMoneyString() plannedBudget?: string;
  @IsOptional() @IsEnum(ScopeStatus) status?: ScopeStatus;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
