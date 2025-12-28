import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedUser extends JwtPayload {
  uid?: string;
  isGuest?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret: string;
  private readonly guestActivityThrottleMs = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = this.configService.get<string>('jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    this.jwtSecret = secret;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requestPath = (request.path || request.originalUrl || '').toLowerCase();
    const openPostEndpoints = [
      '/users/register',
      '/verification/code',
      '/verification/code/verify',
      '/auth/login',
      '/auth/refresh',
      '/auth/guest',
      '/auth/logout',
      '/admin/login',
    ];
    const openGetPrefixes = ['/articles'];
    const openGetEndpoints = ['/metrics', '/observability/http-metrics', '/system/health', '/system/ready', '/infra/health'];

    if (request.method === 'POST' && openPostEndpoints.some((endpoint) => requestPath.endsWith(endpoint))) {
      return true;
    }

    if (request.method === 'GET' && openGetEndpoints.some((endpoint) => requestPath.endsWith(endpoint))) {
      return true;
    }

    if (request.method === 'GET' && openGetPrefixes.some((prefix) => requestPath.includes(prefix))) {
      return true;
    }

    const authorization = request.headers?.authorization || request.headers?.Authorization;

    if (!authorization || typeof authorization !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authorization.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization format');
    }

    try {
      const payload = verify(token, this.jwtSecret) as AuthenticatedUser;
      request.user = payload;

      // Sliding retention: refresh guest lastActiveAt (throttled)
      if (payload?.uid && payload?.isGuest) {
        const cutoff = new Date(Date.now() - this.guestActivityThrottleMs);
        await this.prisma.user.updateMany({
          where: {
            id: String(payload.uid),
            isGuest: true,
            lastActiveAt: { lt: cutoff },
          },
          data: { lastActiveAt: new Date() },
        });
      }

      return true;
    } catch (error: any) {
      throw new UnauthorizedException(error?.message || 'Invalid token');
    }
  }
}
