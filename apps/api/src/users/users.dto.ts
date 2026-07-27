import { UserRole, UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @MaxLength(120) name: string;
  @IsEmail() @MaxLength(180) email: string;
  @IsString() @MinLength(8) @MaxLength(100) password: string;
  @IsEnum(UserRole) role: UserRole;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsEmail() @MaxLength(180) email?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
}

export class UserStatusDto {
  @IsEnum(UserStatus) status: UserStatus;
}

export class ResetPasswordDto {
  @IsString() @MinLength(8) @MaxLength(100) password: string;
}
