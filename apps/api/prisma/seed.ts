import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PIPELINE_NAME = 'Default Sales Pipeline';
const DEFAULT_STAGES = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];

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

  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
    },
  });

  for (const organizationItem of organizations) {
    const pipeline = await prisma.pipeline.upsert({
      where: {
        organizationId_name: {
          organizationId: organizationItem.id,
          name: DEFAULT_PIPELINE_NAME,
        },
      },
      update: {},
      create: {
        organizationId: organizationItem.id,
        name: DEFAULT_PIPELINE_NAME,
      },
    });

    await Promise.all(
      DEFAULT_STAGES.map((stageName, index) =>
        prisma.stage.upsert({
          where: {
            pipelineId_order: {
              pipelineId: pipeline.id,
              order: index + 1,
            },
          },
          update: {
            name: stageName,
          },
          create: {
            pipelineId: pipeline.id,
            name: stageName,
            order: index + 1,
          },
        }),
      ),
    );
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
