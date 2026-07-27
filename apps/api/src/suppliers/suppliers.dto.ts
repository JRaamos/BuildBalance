import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateSupplierDto {
  @IsString() @MaxLength(140) name: string;
  @IsOptional() @IsString() @MaxLength(24) document?: string;
  @IsOptional() @IsString() @MaxLength(24) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(180) email?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
