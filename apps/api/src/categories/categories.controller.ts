import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from './categories.dto';

@ApiTags('Categorias')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list() { return this.prisma.category.findMany({ orderBy: { name: 'asc' } }); }
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name.trim(), active: dto.active ?? true } });
  }
}
