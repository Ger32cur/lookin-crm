import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '../prisma/generated/test-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Pipelines E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let tokenOrgA: string;
  let tokenOrgB: string;
  let pipelineAId: string;
  let pipelineBId: string;
  let leadStageAId: string;
  let qualifiedStageAId: string;
  let contactAId: string;
  let contactBId: string;
  let opportunityId: string;

  const credentials = {
    orgA: { email: 'pipeline-a@demo.local', password: 'Admin12345!' },
    orgB: { email: 'pipeline-b@demo.local', password: 'Admin67890!' },
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    const [passwordHashA, passwordHashB] = await Promise.all([
      hash(credentials.orgA.password, 10),
      hash(credentials.orgB.password, 10),
    ]);

    const [organizationA, organizationB] = await Promise.all([
      prisma.organization.create({
        data: {
          name: 'Pipeline Org A',
          slug: 'pipeline-org-a',
        },
      }),
      prisma.organization.create({
        data: {
          name: 'Pipeline Org B',
          slug: 'pipeline-org-b',
        },
      }),
    ]);

    await prisma.user.createMany({
      data: [
        {
          organizationId: organizationA.id,
          email: credentials.orgA.email,
          passwordHash: passwordHashA,
          role: 'admin',
          isActive: true,
        },
        {
          organizationId: organizationB.id,
          email: credentials.orgB.email,
          passwordHash: passwordHashB,
          role: 'admin',
          isActive: true,
        },
      ],
    });

    const [contactA, contactB] = await Promise.all([
      prisma.contact.create({
        data: {
          organizationId: organizationA.id,
          firstName: 'Alice',
          lastName: 'A',
          email: 'alice-pipeline@demo.local',
          status: 'lead',
        },
      }),
      prisma.contact.create({
        data: {
          organizationId: organizationB.id,
          firstName: 'Bob',
          lastName: 'B',
          email: 'bob-pipeline@demo.local',
          status: 'lead',
        },
      }),
    ]);

    contactAId = contactA.id;
    contactBId = contactB.id;

    const [pipelineA, pipelineB] = await Promise.all([
      prisma.pipeline.create({
        data: {
          organizationId: organizationA.id,
          name: 'Default Sales Pipeline',
          stages: {
            create: [
              { name: 'Lead', order: 1 },
              { name: 'Qualified', order: 2 },
              { name: 'Proposal', order: 3 },
              { name: 'Won', order: 4 },
              { name: 'Lost', order: 5 },
            ],
          },
        },
        include: {
          stages: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.pipeline.create({
        data: {
          organizationId: organizationB.id,
          name: 'Default Sales Pipeline',
          stages: {
            create: [
              { name: 'Lead', order: 1 },
              { name: 'Qualified', order: 2 },
              { name: 'Proposal', order: 3 },
              { name: 'Won', order: 4 },
              { name: 'Lost', order: 5 },
            ],
          },
        },
      }),
    ]);

    pipelineAId = pipelineA.id;
    pipelineBId = pipelineB.id;
    leadStageAId = pipelineA.stages[0].id;
    qualifiedStageAId = pipelineA.stages[1].id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('login -> get pipeline -> create opportunity -> move stage', async () => {
    const loginOrgA = await request(app.getHttpServer()).post('/api/auth/login').send(credentials.orgA);
    expect(loginOrgA.status).toBe(201);
    tokenOrgA = loginOrgA.body.accessToken as string;

    const loginOrgB = await request(app.getHttpServer()).post('/api/auth/login').send(credentials.orgB);
    expect(loginOrgB.status).toBe(201);
    tokenOrgB = loginOrgB.body.accessToken as string;

    const pipelinesResponse = await request(app.getHttpServer())
      .get('/api/pipelines')
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(pipelinesResponse.status).toBe(200);

    expect(pipelinesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pipelineAId,
          organizationId: expect.any(String),
          stages: expect.any(Array),
        }),
      ]),
    );

    const createOpportunity = await request(app.getHttpServer())
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({
        pipelineId: pipelineAId,
        contactId: contactAId,
        title: 'FamilyPool Expansion',
        value: 12000,
      });

    expect(createOpportunity.status).toBe(201);
    expect(createOpportunity.body).toMatchObject({
      id: expect.any(String),
      organizationId: expect.any(String),
      pipelineId: pipelineAId,
      contactId: contactAId,
      stageId: leadStageAId,
      title: 'FamilyPool Expansion',
      value: 12000,
    });

    opportunityId = createOpportunity.body.id as string;

    const moveOpportunity = await request(app.getHttpServer())
      .patch(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({ stageId: qualifiedStageAId });
    expect(moveOpportunity.status).toBe(200);
    expect(moveOpportunity.body).toMatchObject({
      id: opportunityId,
      stageId: qualifiedStageAId,
    });

    const opportunitiesResponse = await request(app.getHttpServer())
      .get(`/api/opportunities?pipelineId=${pipelineAId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(opportunitiesResponse.status).toBe(200);
    expect(opportunitiesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: opportunityId,
          stageId: qualifiedStageAId,
        }),
      ]),
    );
  });

  it('cross-tenant isolation for opportunities', async () => {
    const listFromOrgB = await request(app.getHttpServer())
      .get(`/api/opportunities?pipelineId=${pipelineAId}`)
      .set('Authorization', `Bearer ${tokenOrgB}`);
    expect(listFromOrgB.status).toBe(404);

    const createFromOrgBWithForeignPipeline = await request(app.getHttpServer())
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${tokenOrgB}`)
      .send({
        pipelineId: pipelineAId,
        contactId: contactBId,
        title: 'Invalid Cross Tenant Deal',
      });
    expect(createFromOrgBWithForeignPipeline.status).toBe(404);

    const updateFromOrgB = await request(app.getHttpServer())
      .patch(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${tokenOrgB}`)
      .send({ stageId: leadStageAId });
    expect(updateFromOrgB.status).toBe(404);

    const listOwnPipeline = await request(app.getHttpServer())
      .get(`/api/opportunities?pipelineId=${pipelineBId}`)
      .set('Authorization', `Bearer ${tokenOrgB}`);
    expect(listOwnPipeline.status).toBe(200);
    expect(listOwnPipeline.body).toEqual([]);
  });
});
