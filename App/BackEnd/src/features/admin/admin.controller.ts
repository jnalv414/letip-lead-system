import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../caching/redis.service';

interface ApiServiceStatus {
  name: string;
  configured: boolean;
}

interface ApiStatusResponse {
  services: ApiServiceStatus[];
  redis: {
    connected: boolean;
  };
}

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Get('api-status')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get API service status',
    description:
      'Returns configuration status of external API services and Redis connection. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'API status retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async getApiStatus(): Promise<ApiStatusResponse> {
    const apifyKey =
      this.configService.get('APIFY_API_KEY') ||
      process.env.APIFY_API_KEY;

    const hunterKey = this.configService.getHunterApiKey();
    const abstractKey = this.configService.getAbstractApiKey();
    const sendgridKey = this.configService.getSendGridApiKey();

    const redisPing = await this.redisService.ping();

    return {
      services: [
        { name: 'apify', configured: !!apifyKey },
        { name: 'hunter', configured: !!hunterKey },
        { name: 'abstractapi', configured: !!abstractKey },
        { name: 'sendgrid', configured: !!sendgridKey },
      ],
      redis: {
        connected: redisPing === 'PONG',
      },
    };
  }
}
