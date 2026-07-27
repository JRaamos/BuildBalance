import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@buildbalance.local' })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiProperty({ example: 'change-me-now' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
