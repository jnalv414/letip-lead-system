import { ApiProperty } from '@nestjs/swagger';

/**
 * Single pipeline stage item in the pipeline statistics response.
 */
export class PipelineStageDto {
  @ApiProperty({
    description: 'Pipeline stage name',
    example: 'New Leads',
    enum: ['New Leads', 'Qualified', 'Needs Review'],
  })
  stage: string;

  @ApiProperty({
    description: 'Number of businesses in this stage',
    example: 89,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total businesses',
    example: 32.8,
  })
  percentage: number;
}

/**
 * Response DTO for pipeline statistics endpoint.
 *
 * Returns businesses grouped by enrichment pipeline stage:
 * - 'pending' -> 'New Leads'
 * - 'enriched' -> 'Qualified'
 * - 'failed' -> 'Needs Review'
 */
export class PipelineStatsDto {
  @ApiProperty({
    description: 'Array of pipeline stages with business counts',
    type: [PipelineStageDto],
  })
  stages: PipelineStageDto[];

  @ApiProperty({
    description: 'Total number of businesses',
    example: 271,
  })
  total: number;
}
