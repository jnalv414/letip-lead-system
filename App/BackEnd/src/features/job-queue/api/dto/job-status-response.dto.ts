import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../config/queue.config';

/**
 * Job status response DTO.
 *
 * Returns current state of a job including progress, errors, and results.
 */
export class JobStatusResponseDto {
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
    description: 'Current job status',
    enum: JobStatus,
    example: 'active',
  })
  status: JobStatus;

  @ApiProperty({
    description: 'Job progress (0-100)',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Job data payload',
    example: { searchQuery: 'plumbers', location: 'Freehold, NJ' },
  })
  data: Record<string, any>;

  @ApiProperty({
    description: 'Job result (if completed)',
    example: { found: 50, saved: 48 },
    required: false,
  })
  result?: Record<string, any>;

  @ApiProperty({
    description: 'Error message (if failed)',
    example: 'Rate limit exceeded',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Number of retry attempts made',
    example: 2,
  })
  attemptsMade: number;

  @ApiProperty({
    description: 'Maximum retry attempts allowed',
    example: 3,
  })
  maxAttempts: number;

  @ApiProperty({
    description: 'Timestamp when job was created',
    example: '2025-01-21T15:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp when job was started',
    example: '2025-01-21T15:30:05.000Z',
    required: false,
  })
  startedAt?: string;

  @ApiProperty({
    description: 'Timestamp when job was completed',
    example: '2025-01-21T15:32:10.000Z',
    required: false,
  })
  completedAt?: string;

  @ApiProperty({
    description: 'User ID who created the job',
    example: 'user123',
    required: false,
  })
  userId?: string;
}

/**
 * Paginated list of jobs response DTO.
 */
export class JobListResponseDto {
  @ApiProperty({
    description: 'Array of jobs',
    type: [JobStatusResponseDto],
  })
  jobs: JobStatusResponseDto[];

  @ApiProperty({
    description: 'Total number of jobs matching query',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of jobs per page',
    example: 20,
  })
  limit: number;
}
