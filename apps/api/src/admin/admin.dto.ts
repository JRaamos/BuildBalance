import { ProjectPermission } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class GrantAccessDto {
  @IsUUID() userId: string;
  @IsEnum(ProjectPermission) permission: ProjectPermission;
}

export class ChangeAccessDto {
  @IsEnum(ProjectPermission) permission: ProjectPermission;
}
