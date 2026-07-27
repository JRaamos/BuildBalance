import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
export class CategoryDto {
  @IsString() @MaxLength(100) name: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
