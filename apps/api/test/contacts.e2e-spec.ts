import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { PrismaClient } from '../prisma/generated/test-client';

describe('Contacts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let tokenOrgA: string;

  const credentials = {
    orgA: { email: 'admin-a@demo.local', password: 'Admin12345!' },
    orgB: { email: 'admin-b@demo.local', password: 'Admin67890!' },
  };

  let organizationAId: string;
  let organizationBId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    const [passwordHashA, passwordHashB] = await Promise.all([
      hash(credentials.orgA.password, 10),
      hash(credentials.orgB.password, 10),
    ]);

    const organizationA = await prisma.organization.create({
      data: {
        name: 'Demo Org A',
        slug: 'demo-org-a',
      },
    });
    const organizationB = await prisma.organization.create({
      data: {
        name: 'Demo Org B',
        slug: 'demo-org-b',
      },
    });

    organizationAId = organizationA.id;
    organizationBId = organizationB.id;

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

    const loginOrgA = await request(app.getHttpServer()).post('/api/auth/login').send(credentials.orgA);
    tokenOrgA = loginOrgA.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('POST /api/contacts creates a contact scoped to token organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({
        name: 'Alice Contact',
        email: 'alice@contact.local',
        phone: '+1 555 123 456',
        notes: 'VIP lead',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      organizationId: organizationAId,
      name: 'Alice Contact',
      email: 'alice@contact.local',
      phone: '+1 555 123 456',
      notes: 'VIP lead',
    });
  });

  it('GET /api/contacts returns only contacts from token organization', async () => {
    await prisma.contact.create({
      data: {
        organizationId: organizationAId,
        name: 'Org A Contact',
        email: 'orga@contact.local',
      },
    });
    await prisma.contact.create({
      data: {
        organizationId: organizationBId,
        name: 'Org B Contact',
        email: 'orgb@contact.local',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgA}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    for (const contact of response.body as Array<{ organizationId: string }>) {
      expect(contact.organizationId).toBe(organizationAId);
    }
  });

  it('PATCH /api/contacts/:id updates only in-tenant contacts', async () => {
    const ownContact = await prisma.contact.create({
      data: {
        organizationId: organizationAId,
        name: 'Before Update',
        email: 'before@contact.local',
      },
    });
    const foreignContact = await prisma.contact.create({
      data: {
        organizationId: organizationBId,
        name: 'Other Org Contact',
        email: 'other@contact.local',
      },
    });

    const updated = await request(app.getHttpServer())
      .patch(`/api/contacts/${ownContact.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({ notes: 'Updated note' });

    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: ownContact.id,
      organizationId: organizationAId,
      notes: 'Updated note',
    });

    const forbiddenByScope = await request(app.getHttpServer())
      .patch(`/api/contacts/${foreignContact.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({ notes: 'Should fail' });

    expect(forbiddenByScope.status).toBe(404);
  });

  it('DELETE /api/contacts/:id deletes only in-tenant contacts', async () => {
    const ownContact = await prisma.contact.create({
      data: {
        organizationId: organizationAId,
        name: 'To Delete',
        email: 'delete@contact.local',
      },
    });
    const foreignContact = await prisma.contact.create({
      data: {
        organizationId: organizationBId,
        name: 'Keep Me',
        email: 'keep@contact.local',
      },
    });

    const removed = await request(app.getHttpServer())
      .delete(`/api/contacts/${ownContact.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(removed.status).toBe(204);

    const removedInDb = await prisma.contact.findUnique({ where: { id: ownContact.id } });
    expect(removedInDb).toBeNull();

    const foreignDeleteAttempt = await request(app.getHttpServer())
      .delete(`/api/contacts/${foreignContact.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(foreignDeleteAttempt.status).toBe(404);

    const foreignStillExists = await prisma.contact.findUnique({ where: { id: foreignContact.id } });
    expect(foreignStillExists).not.toBeNull();
  });
});
