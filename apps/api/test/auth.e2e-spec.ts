import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { PrismaClient } from '../prisma/generated/test-client';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const seeded = {
    email: 'admin@demo.local',
    password: 'Admin12345!',
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    const passwordHash = await hash(seeded.password, 10);
    const organization = await prisma.organization.create({
      data: {
        name: 'Demo Organization',
        slug: 'demo-org',
      },
    });

    await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: seeded.email,
        passwordHash,
        role: 'admin',
        isActive: true,
      },
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

  it('POST /api/auth/login returns accessToken and user with organizationId', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: seeded.email,
      password: seeded.password,
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: seeded.email,
      role: 'admin',
      organizationId: expect.any(String),
      id: expect.any(String),
    });
  });

  it('GET /api/auth/me requires bearer token and returns user info', async () => {
    const unauthorized = await request(app.getHttpServer()).get('/api/auth/me');
    expect(unauthorized.status).toBe(401);

    const login = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: seeded.email,
      password: seeded.password,
    });
    const token = login.body.accessToken as string;

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      email: seeded.email,
      role: 'admin',
      organizationId: expect.any(String),
    });
  });
});
