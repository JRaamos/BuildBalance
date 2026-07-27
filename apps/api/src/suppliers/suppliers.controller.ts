import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './suppliers.dto';

@ApiTags('Fornecedores')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.supplier.findMany({
      where: user.role === UserRole.ADMIN ? {} : { ownerId: user.id },
      orderBy: { name: 'asc' }
    });
  }
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { ...dto, name: dto.name.trim(), ownerId: user.id } });
  }
}
