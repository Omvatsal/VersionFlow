import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service.js';
import { ApiResponse, SystemHealth } from '@versionflow/contracts';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<ApiResponse<SystemHealth>> {
    const data = await this.healthService.getSystemHealth();
    return {
      success: data.status !== 'unhealthy',
      data,
    };
  }

  @Get('liveness')
  getLiveness(): ApiResponse<{ status: string }> {
    return {
      success: true,
      data: { status: 'alive' },
    };
  }

  @Get('readiness')
  async getReadiness(@Res() res: Response) {
    const ready = await this.healthService.isReady();
    if (!ready) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_READY',
          message: 'Database connection check failed',
        },
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      data: { status: 'ready' },
    });
  }
}

