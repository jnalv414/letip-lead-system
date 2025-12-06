import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';
import { Public } from './features/auth/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    // Redirect to dashboard
    res.redirect(301, '/dashboard');
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }
}
