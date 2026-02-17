import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '../prisma/generated/test-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Contacts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let tokenOrgA: string;
  let tokenOrgB: string;
  let organizationAId: string;
  let organizationBId: string;
  let createdContactId: string;

  const credentials = {
    orgA: { email: 'admin-a@demo.local', password: 'Admin12345!' },
    orgB: { email: 'admin-b@demo.local', password: 'Admin67890!' },
  };

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('login returns bearer token for each tenant', async () => {
    const loginOrgA = await request(app.getHttpServer()).post('/api/auth/login').send(credentials.orgA);
    expect(loginOrgA.status).toBe(201);
    expect(loginOrgA.body.accessToken).toEqual(expect.any(String));
    tokenOrgA = loginOrgA.body.accessToken as string;

    const loginOrgB = await request(app.getHttpServer()).post('/api/auth/login').send(credentials.orgB);
    expect(loginOrgB.status).toBe(201);
    expect(loginOrgB.body.accessToken).toEqual(expect.any(String));
    tokenOrgB = loginOrgB.body.accessToken as string;
  });

  it('POST /api/contacts creates a contact in tenant A', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({
        firstName: 'Alice',
        lastName: 'Anderson',
        email: 'alice@tenant-a.local',
        phone: '+1 555 123 456',
        status: 'lead',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      organizationId: organizationAId,
      firstName: 'Alice',
      lastName: 'Anderson',
      email: 'alice@tenant-a.local',
      phone: '+1 555 123 456',
      status: 'lead',
    });

    createdContactId = response.body.id as string;
  });

  it('GET /api/contacts lists and includes created contact', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgA}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
    });

    const contactIds = (response.body.items as Array<{ id: string }>).map((item) => item.id);
    expect(contactIds).toContain(createdContactId);
  });

  it('GET /api/contacts/:id returns in-tenant contact', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: createdContactId,
      organizationId: organizationAId,
    });
  });

  it('PATCH /api/contacts/:id updates in-tenant contact', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .send({ status: 'customer' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: createdContactId,
      status: 'customer',
    });
  });

  it('cross-tenant isolation: tenant B cannot see tenant A contacts', async () => {
    const listOrgB = await request(app.getHttpServer())
      .get('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgB}`);
    expect(listOrgB.status).toBe(200);

    const visibleIds = (listOrgB.body.items as Array<{ id: string }>).map((item) => item.id);
    expect(visibleIds).not.toContain(createdContactId);

    const readOrgB = await request(app.getHttpServer())
      .get(`/api/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${tokenOrgB}`);
    expect(readOrgB.status).toBe(404);
  });

  it('DELETE /api/contacts/:id deletes in-tenant contact', async () => {
    const removed = await request(app.getHttpServer())
      .delete(`/api/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(removed.status).toBe(204);

    const fetchDeleted = await request(app.getHttpServer())
      .get(`/api/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);
    expect(fetchDeleted.status).toBe(404);

    const stillNotVisibleFromB = await request(app.getHttpServer())
      .get('/api/contacts')
      .set('Authorization', `Bearer ${tokenOrgB}`);
    expect(stillNotVisibleFromB.status).toBe(200);

    for (const contact of stillNotVisibleFromB.body.items as Array<{ organizationId: string }>) {
      expect(contact.organizationId).toBe(organizationBId);
    }
  });
});
