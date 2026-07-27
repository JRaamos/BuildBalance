import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  record(actorId: string, action: string, entityType: string, entityId: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({ data: { actorId, action, entityType, entityId, metadata } });
  }
}
