import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JobQueueService } from '../domain/job-queue.service';
import { JobStatusTrackerService } from '../domain/job-status-tracker.service';
import { CreateScrapingJobDto } from './dto/create-scraping-job.dto';
import { CreateEnrichmentJobDto } from './dto/create-enrichment-job.dto';
import { JobStatusResponseDto, JobListResponseDto } from './dto/job-status-response.dto';
import {
  CreateCsvImportJobDto,
  CsvValidationResultDto,
  CsvImportResultDto,
} from './dto/csv-import.dto';
import { QueueName, JobStatus, JobType } from '../config/queue.config';

/**
 * Job Queue Controller
 *
 * REST API endpoints for job queue management:
 * - Create jobs (scraping, enrichment, outreach)
 * - Query job status
 * - List jobs by user or queue
 * - Cancel jobs
 * - Monitor queue metrics
 *
 * All endpoints support WebSocket events for real-time updates.
 */
@Controller('api/jobs')
@ApiTags('Job Queue')
export class JobQueueController {
  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly jobStatusTracker: JobStatusTrackerService,
  ) {}

  /**
   * Create a Google Maps scraping job.
   */
  @Post('scraping')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a Google Maps scraping job',
    description:
      'Enqueues a new scraping job to collect business data from Google Maps. Job executes asynchronously.',
  })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    schema: {
      properties: {
        jobId: { type: 'string', example: '1' },
        queueName: { type: 'string', example: 'scraping-jobs' },
        status: { type: 'string', example: 'pending' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createScrapingJob(@Body() dto: CreateScrapingJobDto) {
    const job = await this.jobQueueService.createScrapingJob(dto);
    return {
      jobId: job.id,
      queueName: job.queueName,
      status: 'pending',
      message: 'Scraping job created successfully',
    };
  }

  /**
   * Create a business enrichment job.
   */
  @Post('enrichment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a business enrichment job',
    description:
      'Enqueues enrichment jobs for one or more businesses. Uses Hunter.io and AbstractAPI to find contacts and company data.',
  })
  @ApiResponse({
    status: 201,
    description: 'Job(s) created successfully',
    schema: {
      properties: {
        jobIds: { type: 'array', items: { type: 'string' }, example: ['1', '2', '3'] },
        queueName: { type: 'string', example: 'enrichment-jobs' },
        count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createEnrichmentJob(@Body() dto: CreateEnrichmentJobDto) {
    const jobs = await this.jobQueueService.createEnrichmentJob(dto);
    return {
      jobIds: jobs.map((job) => job.id),
      queueName: QueueName.ENRICHMENT,
      count: jobs.length,
      message: `Created ${jobs.length} enrichment job(s)`,
    };
  }

  /**
   * Create an outreach message generation job.
   */
  @Post('outreach')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an outreach message generation job',
    description: 'Generates a personalized outreach message for a business using AI templates.',
  })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    schema: {
      properties: {
        jobId: { type: 'string', example: '1' },
        queueName: { type: 'string', example: 'outreach-jobs' },
        status: { type: 'string', example: 'pending' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createOutreachJob(
    @Body() body: { businessId: number; contactId?: number; userId?: string },
  ) {
    const job = await this.jobQueueService.createOutreachJob(
      body.businessId,
      body.contactId,
      body.userId,
    );
    return {
      jobId: job.id,
      queueName: job.queueName,
      status: 'pending',
      message: 'Outreach job created successfully',
    };
  }

  /**
   * Get job status by ID.
   */
  @Get(':jobId')
  @ApiOperation({
    summary: 'Get job status by ID',
    description:
      'Retrieves current status, progress, and result of a job. Combines live queue data with historical database records.',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Success', type: JobStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatusResponseDto> {
    return await this.jobStatusTracker.getJobStatus(jobId);
  }

  /**
   * List user's jobs with pagination.
   */
  @Get()
  @ApiOperation({
    summary: "List user's jobs",
    description: 'Returns paginated list of jobs created by a specific user, ordered by creation date.',
  })
  @ApiQuery({ name: 'userId', required: true, type: String, example: 'user123' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, default: 20 })
  @ApiResponse({ status: 200, description: 'Success', type: JobListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getUserJobs(
    @Query('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<JobListResponseDto> {
    return await this.jobStatusTracker.getJobsByUser(userId, Number(page), Number(limit));
  }

  /**
   * List jobs by queue and status.
   */
  @Get('queue/:queueName')
  @ApiOperation({
    summary: 'List jobs by queue',
    description: 'Returns paginated list of jobs in a specific queue, optionally filtered by status.',
  })
  @ApiParam({
    name: 'queueName',
    description: 'Queue name',
    enum: Object.values(QueueName),
    example: 'scraping-jobs',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: Object.values(JobStatus),
    example: 'active',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, default: 20 })
  @ApiResponse({ status: 200, description: 'Success', type: JobListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getQueueJobs(
    @Param('queueName') queueName: QueueName,
    @Query('status') status?: JobStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<JobListResponseDto> {
    return await this.jobStatusTracker.getJobsByQueue(
      queueName,
      status,
      Number(page),
      Number(limit),
    );
  }

  /**
   * Get queue metrics.
   */
  @Get('metrics/:queueName')
  @ApiOperation({
    summary: 'Get queue metrics',
    description: 'Returns job counts by status for a specific queue (waiting, active, completed, failed, etc.).',
  })
  @ApiParam({
    name: 'queueName',
    description: 'Queue name',
    enum: Object.values(QueueName),
    example: 'scraping-jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      properties: {
        waiting: { type: 'number', example: 5 },
        active: { type: 'number', example: 2 },
        completed: { type: 'number', example: 150 },
        failed: { type: 'number', example: 3 },
        delayed: { type: 'number', example: 0 },
        total: { type: 'number', example: 160 },
      },
    },
  })
  async getQueueMetrics(@Param('queueName') queueName: QueueName) {
    return await this.jobStatusTracker.getQueueMetrics(queueName);
  }

  /**
   * Get all queues metrics.
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get metrics for all queues',
    description: 'Returns job counts by status for all queues.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      properties: {
        'scraping-jobs': {
          type: 'object',
          properties: {
            waiting: { type: 'number' },
            active: { type: 'number' },
            completed: { type: 'number' },
            failed: { type: 'number' },
          },
        },
        'enrichment-jobs': { type: 'object' },
        'outreach-jobs': { type: 'object' },
      },
    },
  })
  async getAllMetrics() {
    return await this.jobStatusTracker.getAllQueuesMetrics();
  }

  /**
   * Get health status.
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get job queue system health',
    description: 'Returns health status of Redis connection and all queues.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      properties: {
        healthy: { type: 'boolean', example: true },
        redis: { type: 'boolean', example: true },
        queues: {
          type: 'object',
          properties: {
            'scraping-jobs': { type: 'boolean', example: true },
            'enrichment-jobs': { type: 'boolean', example: true },
            'outreach-jobs': { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  async getHealth() {
    return await this.jobStatusTracker.getHealthStatus();
  }

  /**
   * Cancel a job.
   */
  @Delete(':jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a job',
    description: 'Cancels a pending or active job. Completed or failed jobs cannot be cancelled.',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID to cancel', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Job cancelled successfully',
    schema: {
      properties: {
        jobId: { type: 'string', example: '1' },
        cancelled: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Job cancelled successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'Job cannot be cancelled (already completed/failed)' })
  async cancelJob(@Param('jobId') jobId: string) {
    const cancelled = await this.jobStatusTracker.cancelJob(jobId);
    return {
      jobId,
      cancelled,
      message: cancelled ? 'Job cancelled successfully' : 'Job could not be cancelled',
    };
  }

  // ==========================================
  // CSV Import Endpoints
  // ==========================================

  /**
   * Upload and validate a CSV file for import.
   */
  @Post('csv/validate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/tmp/letip-uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
          callback(new BadRequestException('Only CSV files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @ApiOperation({
    summary: 'Validate CSV file for import',
    description:
      'Uploads and validates a CSV file, returning detected columns, sample data, and any validation errors.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to validate',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: CsvValidationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  async validateCsvFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CsvValidationResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate CSV and return preview
    return await this.jobQueueService.validateCsvFile(file.path, file.originalname);
  }

  /**
   * Create a CSV import job.
   */
  @Post('csv/import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/tmp/letip-uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
          callback(new BadRequestException('Only CSV files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @ApiOperation({
    summary: 'Create CSV import job',
    description:
      'Uploads a CSV file and enqueues an import job. Returns job ID for progress tracking.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to import',
        },
        columnMappings: {
          type: 'string',
          description: 'JSON string of column mappings array',
          example: '[{"csvColumn":"Name","dbField":"name"}]',
        },
        skipHeader: {
          type: 'boolean',
          description: 'Skip first row as header',
          default: true,
        },
        duplicateHandling: {
          type: 'string',
          enum: ['skip', 'update', 'create_new'],
          default: 'skip',
        },
        defaultCity: {
          type: 'string',
          description: 'Default city for imported businesses',
        },
        defaultState: {
          type: 'string',
          description: 'Default state for imported businesses',
        },
        defaultIndustry: {
          type: 'string',
          description: 'Default industry for imported businesses',
        },
        sourceTag: {
          type: 'string',
          description: 'Source tag for imported businesses',
        },
      },
      required: ['file', 'columnMappings'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import job created',
    schema: {
      properties: {
        jobId: { type: 'string', example: 'csv-import-12345' },
        queueName: { type: 'string', example: 'csv-import-jobs' },
        status: { type: 'string', example: 'pending' },
        filename: { type: 'string', example: 'my_leads.csv' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or mapping' })
  async createCsvImportJob(
    @UploadedFile() file: Express.Multer.File,
    @Body('columnMappings') columnMappingsJson: string,
    @Body('skipHeader') skipHeader: string = 'true',
    @Body('duplicateHandling') duplicateHandling: string = 'skip',
    @Body('defaultCity') defaultCity?: string,
    @Body('defaultState') defaultState?: string,
    @Body('defaultIndustry') defaultIndustry?: string,
    @Body('sourceTag') sourceTag?: string,
    @Body('userId') userId: string = 'anonymous',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Parse column mappings from JSON string
    let columnMappings;
    try {
      columnMappings = JSON.parse(columnMappingsJson);
    } catch {
      throw new BadRequestException('Invalid columnMappings JSON format');
    }

    // Create import job
    const job = await this.jobQueueService.createCsvImportJob({
      filePath: file.path,
      originalFilename: file.originalname,
      columnMappings,
      skipHeader: skipHeader === 'true',
      duplicateHandling: duplicateHandling as 'skip' | 'update' | 'create_new',
      defaultCity,
      defaultState,
      defaultIndustry,
      sourceTag,
      userId,
    });

    return {
      jobId: job.id,
      queueName: QueueName.CSV_IMPORT,
      status: 'pending',
      filename: file.originalname,
      message: 'CSV import job created successfully',
    };
  }
}
