import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const users = await this.prisma.user.findMany({
      where: {
        email: data.email.trim().toLowerCase(),
        isActive: true,
      },
    });

    let authenticatedUser: (typeof users)[number] | null = null;

    for (const candidate of users) {
      const isValidPassword = await compare(data.password, candidate.passwordHash);
      if (isValidPassword) {
        authenticatedUser = candidate;
        break;
      }
    }

    if (!authenticatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: authenticatedUser.id,
      organizationId: authenticatedUser.organizationId,
      role: authenticatedUser.role as Role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        organizationId: authenticatedUser.organizationId,
      },
    };
  }

  async me(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
