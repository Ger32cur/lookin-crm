import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

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

  handleRequest<TUser = JwtPayload>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<{
      organizationId?: string;
    }>();

    request.organizationId = (user as unknown as { organizationId: string }).organizationId;



    return user;
  }
}
