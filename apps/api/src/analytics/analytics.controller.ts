import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@UseGuards(AuthGuard)
@Controller('projects/:projectId/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Get('overview') overview(@Req() req: AuthenticatedRequest, @Param('projectId') id: string) { return this.analytics.overview(req.user.id, id); }
  @Get('apis') apis(@Req() req: AuthenticatedRequest, @Param('projectId') id: string) { return this.analytics.apis(req.user.id, id); }
  @Get('versions') versions(@Req() req: AuthenticatedRequest, @Param('projectId') id: string) { return this.analytics.versions(req.user.id, id); }
  @Get('dependencies') dependencies(@Req() req: AuthenticatedRequest, @Param('projectId') id: string) { return this.analytics.dependencies(req.user.id, id); }
  @Get('impact') impact(@Req() req: AuthenticatedRequest, @Param('projectId') id: string) { return this.analytics.impact(req.user.id, id); }
}
