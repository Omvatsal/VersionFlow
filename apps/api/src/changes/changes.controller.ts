import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { ChangesService } from './changes.service.js';

const compareSchema = z.object({ sourceVersionId: z.string().uuid(), targetVersionId: z.string().uuid() });

@UseGuards(AuthGuard)
@Controller('projects/:projectId/changes')
export class ChangesController {
  constructor(private readonly changes: ChangesService) {}
  @Get() list(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) { return this.changes.list(req.user.id, projectId); }
  @Post('compare') compare(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Body() body: unknown) { const input = compareSchema.parse(body); return this.changes.compare(req.user.id, projectId, input.sourceVersionId, input.targetVersionId); }
  @Get('impacts') impacts(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) { return this.changes.impacts(req.user.id, projectId); }
  @Get('analytics') analytics(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) { return this.changes.analytics(req.user.id, projectId); }
  @Post(':changeId/analyze') analyze(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('changeId') changeId: string) { return this.changes.analyze(req.user.id, projectId, changeId); }
}
