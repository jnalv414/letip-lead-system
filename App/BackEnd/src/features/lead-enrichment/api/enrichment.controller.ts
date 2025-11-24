import { Controller, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnrichmentService } from '../domain/enrichment.service';
import { EnrichBatchDto } from './dto/enrich-batch.dto';

@ApiTags('Enrichment')
@Controller('api/enrich')
export class EnrichmentController {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Post(':id')
  @ApiOperation({ summary: 'Enrich a specific business' })
  @ApiResponse({ status: 200, description: 'Business enriched successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  enrichBusiness(@Param('id', ParseIntPipe) id: number) {
    return this.enrichmentService.enrichBusiness(id);
  }

  @Post('batch/process')
  @ApiOperation({ summary: 'Batch enrich multiple pending businesses' })
  @ApiResponse({ status: 200, description: 'Batch enrichment completed' })
  enrichBatch(@Body() enrichBatchDto: EnrichBatchDto) {
    return this.enrichmentService.enrichBatch(enrichBatchDto.count);
  }
}