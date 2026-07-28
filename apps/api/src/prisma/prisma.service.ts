import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { requireDatabaseUrl } from '../common/database-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ datasourceUrl: requireDatabaseUrl() });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
