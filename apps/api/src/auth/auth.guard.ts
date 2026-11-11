import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
export type AuthenticatedRequest = Request & { user: { id: string; sessionId: string } };
@Injectable()
export class AuthGuard implements CanActivate { constructor(private readonly auth: AuthService) {} canActivate(context: ExecutionContext) { const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); const bearer = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined; const cookieToken = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('versionflow_access_token='))?.split('=')[1]; const token = bearer || cookieToken; if (!token) throw new UnauthorizedException('Authentication required'); const claims = this.auth.verifyAccessToken(token); request.user = { id: claims.sub, sessionId: claims.sessionId }; return true; } }
