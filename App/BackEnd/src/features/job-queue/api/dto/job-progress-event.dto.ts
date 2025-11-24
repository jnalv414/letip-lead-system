import { ApiProperty } from '@nestjs/swagger';

/**
 * Job progress event DTO for WebSocket events.
 *
 * Emitted when job progress is updated.
 */
export class JobProgressEventDto {
  @ApiProperty({
    description: 'Event type',
    example: 'job:progress',
  })
  type: string;

  @ApiProperty({
    description: 'Unique job ID',
    example: '1',
  })
  jobId: string;

  @ApiProperty({
    description: 'Queue name',
    example: 'scraping-jobs',
  })
  queueName: string;

  @ApiProperty({
    description: 'Job progress (0-100)',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Progress message',
    example: 'Scraped 38 of 50 businesses',
  })
  message: string;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2025-01-21T15:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'User ID (if job belongs to specific user)',
    example: 'user123',
    required: false,
  })
  userId?: string;
}

/**
 * Job completed event DTO for WebSocket events.
 */
export class JobCompletedEventDto {
  @ApiProperty({
    description: 'Event type',
    example: 'job:completed',
  })
  type: string;

  @ApiProperty({
    description: 'Unique job ID',
    example: '1',
  })
  jobId: string;

  @ApiProperty({
    description: 'Queue name',
    example: 'scraping-jobs',
  })
  queueName: string;

  @ApiProperty({
    description: 'Job result',
    example: { found: 50, saved: 48, errors: [] },
  })
  result: Record<string, any>;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2025-01-21T15:32:10.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'User ID (if job belongs to specific user)',
    example: 'user123',
    required: false,
  })
  userId?: string;
}

/**
 * Job failed event DTO for WebSocket events.
 */
export class JobFailedEventDto {
  @ApiProperty({
    description: 'Event type',
    example: 'job:failed',
  })
  type: string;

  @ApiProperty({
    description: 'Unique job ID',
    example: '1',
  })
  jobId: string;

  @ApiProperty({
    description: 'Queue name',
    example: 'scraping-jobs',
  })
  queueName: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Rate limit exceeded',
  })
  error: string;

  @ApiProperty({
    description: 'Number of attempts made',
    example: 3,
  })
  attemptsMade: number;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2025-01-21T15:35:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'User ID (if job belongs to specific user)',
    example: 'user123',
    required: false,
  })
  userId?: string;
}
