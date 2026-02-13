import { PrismaClient, Role } from '@prisma/client';

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

  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'admin@demo.local',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: 'admin@demo.local',
      passwordHash: 'change-me',
      role: Role.admin,
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
