import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Column mapping for CSV import.
 */
export class CsvColumnMappingDto {
  @ApiProperty({
    description: 'CSV column header name',
    example: 'Business Name',
  })
  @IsString()
  csvColumn: string;

  @ApiProperty({
    description: 'Database field to map to',
    example: 'name',
    enum: [
      'name',
      'address',
      'city',
      'state',
      'zip',
      'phone',
      'website',
      'industry',
      'email',
      'contact_name',
      'contact_title',
      'notes',
    ],
  })
  @IsString()
  @IsIn([
    'name',
    'address',
    'city',
    'state',
    'zip',
    'phone',
    'website',
    'industry',
    'email',
    'contact_name',
    'contact_title',
    'notes',
  ])
  dbField: string;
}

/**
 * Request DTO for creating a CSV import job.
 */
export class CreateCsvImportJobDto {
  @ApiProperty({
    description: 'Path to uploaded CSV file',
    example: '/tmp/uploads/businesses_12345.csv',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my_leads.csv',
  })
  @IsString()
  originalFilename: string;

  @ApiProperty({
    description: 'Column mappings from CSV to database fields',
    type: [CsvColumnMappingDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvColumnMappingDto)
  columnMappings: CsvColumnMappingDto[];

  @ApiProperty({
    description: 'Skip first row (header row)',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipHeader?: boolean = true;

  @ApiProperty({
    description: 'How to handle duplicate records',
    enum: ['skip', 'update', 'create_new'],
    default: 'skip',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['skip', 'update', 'create_new'])
  duplicateHandling?: 'skip' | 'update' | 'create_new' = 'skip';

  @ApiProperty({
    description: 'Default city if not in CSV',
    example: 'Freehold',
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultCity?: string;

  @ApiProperty({
    description: 'Default state if not in CSV',
    example: 'NJ',
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultState?: string;

  @ApiProperty({
    description: 'Default industry if not in CSV',
    example: 'General Services',
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultIndustry?: string;

  @ApiProperty({
    description: 'Source tag for imported businesses',
    example: 'csv-import-2025-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  sourceTag?: string;
}

/**
 * Validation error for a single row.
 */
export class CsvRowErrorDto {
  @ApiProperty({
    description: 'Row number in CSV file',
    example: 15,
  })
  row: number;

  @ApiProperty({
    description: 'Column where error occurred',
    example: 'phone',
  })
  column: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid phone number format',
  })
  message: string;

  @ApiProperty({
    description: 'Original value that caused error',
    example: 'abc123',
    required: false,
  })
  value?: string;
}

/**
 * CSV validation result before import.
 */
export class CsvValidationResultDto {
  @ApiProperty({
    description: 'Whether the CSV is valid for import',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Total number of rows in CSV',
    example: 250,
  })
  totalRows: number;

  @ApiProperty({
    description: 'Number of valid rows',
    example: 245,
  })
  validRows: number;

  @ApiProperty({
    description: 'Number of rows with errors',
    example: 5,
  })
  errorRows: number;

  @ApiProperty({
    description: 'Number of potential duplicates detected',
    example: 12,
  })
  duplicatesDetected: number;

  @ApiProperty({
    description: 'Detailed row errors',
    type: [CsvRowErrorDto],
  })
  errors: CsvRowErrorDto[];

  @ApiProperty({
    description: 'Column headers detected in CSV',
    example: ['Name', 'Address', 'Phone', 'Website'],
  })
  detectedColumns: string[];

  @ApiProperty({
    description: 'Sample rows for preview (first 5)',
    type: 'array',
  })
  sampleRows: Record<string, string>[];
}

/**
 * Import progress event payload.
 */
export class CsvImportProgressDto {
  @ApiProperty({
    description: 'Job ID',
    example: 'csv-import-12345',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['validating', 'importing', 'completed', 'failed'],
    example: 'importing',
  })
  status: 'validating' | 'importing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 45,
  })
  progress: number;

  @ApiProperty({
    description: 'Current row being processed',
    example: 112,
  })
  currentRow: number;

  @ApiProperty({
    description: 'Total rows to process',
    example: 250,
  })
  totalRows: number;

  @ApiProperty({
    description: 'Number of businesses imported so far',
    example: 108,
  })
  importedCount: number;

  @ApiProperty({
    description: 'Number of rows skipped (duplicates/errors)',
    example: 4,
  })
  skippedCount: number;

  @ApiProperty({
    description: 'Number of rows with errors',
    example: 0,
  })
  errorCount: number;

  @ApiProperty({
    description: 'Estimated time remaining in seconds',
    example: 30,
    required: false,
  })
  estimatedSecondsRemaining?: number;
}

/**
 * Final import result.
 */
export class CsvImportResultDto {
  @ApiProperty({
    description: 'Whether import was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Job ID',
    example: 'csv-import-12345',
  })
  jobId: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my_leads.csv',
  })
  filename: string;

  @ApiProperty({
    description: 'Total rows processed',
    example: 250,
  })
  totalRows: number;

  @ApiProperty({
    description: 'Number of businesses created',
    example: 230,
  })
  importedCount: number;

  @ApiProperty({
    description: 'Number of businesses updated (if duplicateHandling=update)',
    example: 8,
  })
  updatedCount: number;

  @ApiProperty({
    description: 'Number of rows skipped',
    example: 12,
  })
  skippedCount: number;

  @ApiProperty({
    description: 'Number of rows with errors',
    example: 0,
  })
  errorCount: number;

  @ApiProperty({
    description: 'Detailed errors',
    type: [CsvRowErrorDto],
  })
  errors: CsvRowErrorDto[];

  @ApiProperty({
    description: 'Import duration in seconds',
    example: 45.2,
  })
  durationSeconds: number;

  @ApiProperty({
    description: 'Timestamp when import completed',
    example: '2025-01-21T15:30:00.000Z',
  })
  completedAt: string;
}
