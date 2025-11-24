import { ApiProperty } from '@nestjs/swagger';

export class ScrapeStatusDto {
  @ApiProperty({
    description: 'Apify actor run ID',
    example: 'HG7MLVqMc8nBxqZLT'
  })
  runId: string;

  @ApiProperty({
    description: 'Current status of the scraping job',
    enum: ['READY', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMING-OUT', 'TIMED-OUT', 'ABORTING', 'ABORTED'],
    example: 'RUNNING'
  })
  status: string;

  @ApiProperty({
    description: 'Number of businesses scraped so far',
    example: 25
  })
  itemCount: number;

  @ApiProperty({
    description: 'Percentage of completion',
    example: 50,
    minimum: 0,
    maximum: 100
  })
  progress?: number;

  @ApiProperty({
    description: 'Error message if failed',
    required: false
  })
  error?: string;
}