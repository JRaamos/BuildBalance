import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME ?? 'Administrador';
  const email = (process.env.ADMIN_EMAIL ?? 'admin@buildbalance.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD deve possuir pelo menos 8 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: { name, email, passwordHash, role: UserRole.ADMIN }
  });

  for (const category of ['Material', 'Mão de obra', 'Transporte', 'Equipamentos', 'Taxas', 'Serviços', 'Outros']) {
    await prisma.category.upsert({
      where: { name: category },
      update: { active: true },
      create: { name: category }
    });
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
