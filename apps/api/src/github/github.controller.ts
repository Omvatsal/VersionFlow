import { Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { GithubService } from './github.service.js';

@Controller('integrations/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}
  @UseGuards(AuthGuard) @Get('install') install(@Req() req: AuthenticatedRequest, @Res() response: Response) { const state = `${req.user.id}.${randomBytes(24).toString('base64url')}`; response.cookie('versionflow_github_app_state', state, { httpOnly: true, sameSite: 'lax', secure: process.env['NODE_ENV'] === 'production', maxAge: 10 * 60 * 1000, path: '/' }); return response.redirect(this.github.installationUrl(state)); }
  @UseGuards(AuthGuard) @Get('repositories/:projectId') repositories(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) { return this.github.repositories(req.user.id, projectId); }
  @UseGuards(AuthGuard) @Post('repositories/:projectId/:repositoryId/:installationId') connect(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('repositoryId') repositoryId: string, @Param('installationId') installationId: string) { return this.github.connect(req.user.id, projectId, repositoryId, installationId); }
  @Get('callback') async callback(@Req() request: Request, @Res() response: Response) { const installationId = Number(request.query.installation_id); const setupAction = request.query.setup_action; const state = typeof request.query.state === 'string' ? request.query.state : ''; const saved = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('versionflow_github_app_state='))?.split('=')[1] || ''; if (!installationId || setupAction === 'cancel' || !state || !saved || state !== saved) return response.status(400).send('Invalid GitHub App installation state'); const [userId] = state.split('.'); const accountLogin = typeof request.query.account_login === 'string' ? request.query.account_login : 'github-account'; const accountId = Number(request.query.account_id) || 0; await this.github.callback(userId!, installationId, { accountId, login: accountLogin, type: 'user' }); response.clearCookie('versionflow_github_app_state', { path: '/' }); return response.redirect(`${this.github.frontendUrl()}/dashboard`); }
}
