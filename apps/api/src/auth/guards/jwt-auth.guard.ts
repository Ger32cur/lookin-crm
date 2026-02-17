import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

type RequestWithOrg = {
  organizationId?: string;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(
    err: unknown,
    user: JwtPayload | undefined,
    _info: unknown,
    context: ExecutionContext,
  ): JwtPayload {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<RequestWithOrg>();

    // Guardamos organizationId en request para que el resto de la app lo use fácil.
    if (user.organizationId) {
      request.organizationId = user.organizationId;
    } else {
      // Si por algún motivo el token no trae orgId, es mejor cortar acá (multi-tenant estricto).
      throw new UnauthorizedException('Missing organizationId in JWT payload');
    }

    return user;
  }
}
