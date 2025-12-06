import { Controller, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EnrichmentService } from '../domain/enrichment.service';
import { EnrichBatchDto } from './dto/enrich-batch.dto';

@ApiTags('Enrichment')
@Controller('api/enrich')
export class EnrichmentController {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Post(':id')
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enrich a specific business' })
  @ApiResponse({ status: 200, description: 'Business enriched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  enrichBusiness(@Param('id', ParseIntPipe) id: number) {
    return this.enrichmentService.enrichBusiness(id);
  }

  @Post('batch/process')
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch enrich multiple pending businesses' })
  @ApiResponse({ status: 200, description: 'Batch enrichment completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  enrichBatch(@Body() enrichBatchDto: EnrichBatchDto) {
    return this.enrichmentService.enrichBatch(enrichBatchDto.count);
  }
}