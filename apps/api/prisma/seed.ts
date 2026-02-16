import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  });

  const passwordHash = await hash('Admin12345!', 10);

  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'admin@demo.local',
      },
    },
    update: {
      passwordHash,
      role: 'admin',
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      email: 'admin@demo.local',
      passwordHash,
      role: 'admin',
      firstName: 'Demo',
      lastName: 'Admin',
    },
  });

  await prisma.eventLog.create({
    data: {
      organizationId: organization.id,
      actorEmail: 'system@bootstrap',
      eventType: 'organization.bootstrap',
      entityType: 'Organization',
      entityId: organization.id,
      metadata: { seed: true },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
