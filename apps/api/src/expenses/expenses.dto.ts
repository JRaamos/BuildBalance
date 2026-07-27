import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsMoneyString } from '../common/validation';

export class CreateExpenseDto {
  @IsOptional() @IsUUID() scopeId?: string;
  @IsString() @MaxLength(180) description: string;
  @IsMoneyString() amount: string;
  @IsDateString() expenseDate: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() supplierId?: string;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @IsEnum(PaymentStatus) paymentStatus: PaymentStatus;
  @IsOptional() @IsString() @MaxLength(80) documentNumber?: string;
  @IsOptional() @IsString() @MaxLength(1200) notes?: string;
}

export class UpdateExpenseDto {
  @IsOptional() @IsUUID() scopeId?: string;
  @IsOptional() @IsString() @MaxLength(180) description?: string;
  @IsOptional() @IsMoneyString() amount?: string;
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() supplierId?: string;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsString() @MaxLength(80) documentNumber?: string;
  @IsOptional() @IsString() @MaxLength(1200) notes?: string;
}
