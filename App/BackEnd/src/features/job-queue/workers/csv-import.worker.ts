import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { Prisma } from '@prisma/client';
import { BaseWorker } from './base-worker';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { EventsGateway as WebsocketGateway } from '../../../websocket/websocket.gateway';
import { PrismaService } from '../../../prisma/prisma.service';
import { JobType, QueueName } from '../config/queue.config';
import {
  CsvColumnMappingDto,
  CsvImportResultDto,
  CsvRowErrorDto,
} from '../api/dto/csv-import.dto';

interface CsvImportJobData {
  userId: string;
  jobType: JobType;
  filePath: string;
  originalFilename: string;
  columnMappings: CsvColumnMappingDto[];
  skipHeader: boolean;
  duplicateHandling: 'skip' | 'update' | 'create_new';
  defaultCity?: string;
  defaultState?: string;
  defaultIndustry?: string;
  sourceTag?: string;
}

/**
 * Worker for processing CSV import jobs.
 *
 * Processes uploaded CSV files and imports businesses into the database.
 * Supports column mapping, duplicate handling, and default values.
 *
 * @emits csv:progress - Progress updates during import
 * @emits csv:completed - When import finishes successfully
 * @emits csv:failed - When import fails
 */
@Injectable()
export class CsvImportWorker extends BaseWorker {
  protected readonly logger = new Logger(CsvImportWorker.name);

  constructor(
    jobHistoryRepository: JobHistoryRepository,
    websocketGateway: WebsocketGateway,
    private readonly prisma: PrismaService,
  ) {
    super(QueueName.CSV_IMPORT, jobHistoryRepository, websocketGateway);
  }

  protected async processJob(job: Job<CsvImportJobData>): Promise<CsvImportResultDto> {
    const startTime = Date.now();
    const {
      filePath,
      originalFilename,
      columnMappings,
      skipHeader,
      duplicateHandling,
      defaultCity,
      defaultState,
      defaultIndustry,
      sourceTag,
      userId,
    } = job.data;

    this.logger.log(`Starting CSV import job ${job.id} for file: ${originalFilename}`);

    const result: CsvImportResultDto = {
      success: false,
      jobId: job.id!,
      filename: originalFilename,
      totalRows: 0,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      durationSeconds: 0,
      completedAt: '',
    };

    try {
      // Create column mapping lookup
      const fieldMapping = new Map<string, string>();
      for (const mapping of columnMappings) {
        fieldMapping.set(mapping.csvColumn.toLowerCase(), mapping.dbField);
      }

      // Count total rows first for progress tracking
      const totalRows = await this.countCsvRows(filePath, skipHeader);
      result.totalRows = totalRows;

      await this.updateProgress(job, 5, 'Starting import');

      // Emit initial progress
      this.emitProgressEvent(userId, job.id!, 'importing', 0, 0, totalRows, 0, 0, 0);

      // Parse and import CSV
      let currentRow = 0;
      let headerRow: string[] = [];

      const parser = createReadStream(filePath).pipe(
        parse({
          relax_column_count: true,
          skip_empty_lines: true,
          trim: true,
        }),
      );

      for await (const row of parser) {
        if (currentRow === 0) {
          headerRow = (row as string[]).map((h: string) => h.toLowerCase().trim());
          if (skipHeader) {
            currentRow++;
            continue;
          }
        }

        const rowNumber = currentRow + 1;
        currentRow++;

        try {
          const businessData = this.mapRowToBusinessData(
            row as string[],
            headerRow,
            fieldMapping,
            rowNumber,
            result.errors,
            defaultCity,
            defaultState,
            defaultIndustry,
            sourceTag,
          );

          if (!businessData) {
            result.skippedCount++;
            continue;
          }

          // Check for duplicates
          const duplicate = await this.findDuplicate(businessData);

          if (duplicate) {
            switch (duplicateHandling) {
              case 'skip':
                result.skippedCount++;
                break;
              case 'update':
                await this.prisma.business.update({
                  where: { id: duplicate.id },
                  data: businessData,
                });
                result.updatedCount++;
                break;
              case 'create_new':
                await this.prisma.business.create({ data: businessData });
                result.importedCount++;
                break;
            }
          } else {
            await this.prisma.business.create({ data: businessData });
            result.importedCount++;
          }

          // Update progress every 10 rows
          if (currentRow % 10 === 0) {
            const progress = Math.round((currentRow / totalRows) * 100);
            await this.updateProgress(job, progress, `Importing row ${currentRow} of ${totalRows}`);

            this.emitProgressEvent(
              userId,
              job.id!,
              'importing',
              progress,
              currentRow,
              totalRows,
              result.importedCount,
              result.skippedCount,
              result.errorCount,
            );
          }
        } catch (rowError: any) {
          result.errorCount++;
          result.errors.push({
            row: rowNumber,
            column: 'unknown',
            message: rowError.message || 'Unknown error processing row',
          });
        }
      }

      // Finalize result
      result.success = result.errorCount === 0;
      result.durationSeconds = (Date.now() - startTime) / 1000;
      result.completedAt = new Date().toISOString();

      await this.updateProgress(job, 100, 'Import complete');

      // Emit completion event
      this.emitCompletionEvent(userId, result);

      // Emit stats:updated to refresh dashboard
      if (this.websocketGateway) {
        this.websocketGateway.emitEvent('stats:updated', {
          type: 'stats:updated',
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(
        `CSV import job ${job.id} completed: ${result.importedCount} imported, ` +
          `${result.updatedCount} updated, ${result.skippedCount} skipped, ${result.errorCount} errors`,
      );

      return result;
    } catch (error: any) {
      result.success = false;
      result.durationSeconds = (Date.now() - startTime) / 1000;
      result.completedAt = new Date().toISOString();
      result.errors.push({
        row: 0,
        column: 'file',
        message: error.message || 'Failed to process CSV file',
      });

      // Emit failure event
      if (this.websocketGateway) {
        this.websocketGateway.emitEvent('csv:failed', {
          type: 'csv:failed',
          jobId: job.id,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.error(`CSV import job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count total rows in CSV file for progress tracking.
   */
  private async countCsvRows(filePath: string, skipHeader: boolean): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;
      const parser = createReadStream(filePath).pipe(
        parse({
          relax_column_count: true,
          skip_empty_lines: true,
        }),
      );

      parser.on('data', () => {
        count++;
      });

      parser.on('end', () => {
        resolve(skipHeader ? count - 1 : count);
      });

      parser.on('error', reject);
    });
  }

  /**
   * Map CSV row to business database fields.
   */
  private mapRowToBusinessData(
    row: string[],
    headerRow: string[],
    fieldMapping: Map<string, string>,
    rowNumber: number,
    errors: CsvRowErrorDto[],
    defaultCity?: string,
    defaultState?: string,
    defaultIndustry?: string,
    sourceTag?: string,
  ): Prisma.businessCreateInput | null {
    // Use Record for building, then cast to Prisma type
    const data: Record<string, string | number | null | undefined> = {
      enrichment_status: 'pending',
      source: sourceTag || 'csv-import',
    };

    // Map each column
    for (let i = 0; i < headerRow.length && i < row.length; i++) {
      const header = headerRow[i];
      const value = row[i]?.trim();
      const dbField = fieldMapping.get(header);

      if (dbField && value) {
        // Validate and transform based on field type
        switch (dbField) {
          case 'phone':
            // Basic phone validation - strip non-digits
            const cleanPhone = value.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
              data.phone = value;
            } else if (cleanPhone.length > 0) {
              errors.push({
                row: rowNumber,
                column: dbField,
                message: 'Invalid phone number format',
                value,
              });
            }
            break;

          case 'email':
            // Basic email validation
            if (value.includes('@') && value.includes('.')) {
              data.email = value.toLowerCase();
            } else {
              errors.push({
                row: rowNumber,
                column: dbField,
                message: 'Invalid email format',
                value,
              });
            }
            break;

          case 'website':
            // Normalize website URL
            if (value) {
              data.website = value.startsWith('http') ? value : `https://${value}`;
            }
            break;

          case 'zip':
            // Basic zip code validation
            const cleanZip = value.replace(/\D/g, '');
            if (cleanZip.length >= 5) {
              data.zip = value;
            }
            break;

          default:
            data[dbField] = value;
        }
      }
    }

    // Apply defaults
    if (!data.city && defaultCity) data.city = defaultCity;
    if (!data.state && defaultState) data.state = defaultState;
    if (!data.industry && defaultIndustry) data.industry = defaultIndustry;

    // Validate required fields
    if (!data.name) {
      errors.push({
        row: rowNumber,
        column: 'name',
        message: 'Business name is required',
      });
      return null;
    }

    // Cast to Prisma type - name is guaranteed to exist at this point
    return {
      name: data.name as string,
      address: data.address as string | undefined,
      city: data.city as string | undefined,
      state: data.state as string | undefined,
      zip: data.zip as string | undefined,
      phone: data.phone as string | undefined,
      website: data.website as string | undefined,
      industry: data.industry as string | undefined,
      enrichment_status: data.enrichment_status as string,
      source: data.source as string,
    };
  }

  /**
   * Find duplicate business by name and address/phone.
   */
  private async findDuplicate(
    data: Prisma.businessCreateInput,
  ): Promise<{ id: number } | null> {
    // Try to find by name + city combination
    const existing = await this.prisma.business.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
        ...(data.city && {
          city: {
            equals: data.city,
            mode: 'insensitive',
          },
        }),
      },
      select: { id: true },
    });

    return existing;
  }

  /**
   * Emit progress event via WebSocket.
   */
  private emitProgressEvent(
    userId: string,
    jobId: string,
    status: 'validating' | 'importing' | 'completed' | 'failed',
    progress: number,
    currentRow: number,
    totalRows: number,
    importedCount: number,
    skippedCount: number,
    errorCount: number,
  ): void {
    if (this.websocketGateway) {
      this.websocketGateway.emitEvent('csv:progress', {
        type: 'csv:progress',
        jobId,
        userId,
        status,
        progress,
        currentRow,
        totalRows,
        importedCount,
        skippedCount,
        errorCount,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit completion event via WebSocket.
   */
  private emitCompletionEvent(userId: string, result: CsvImportResultDto): void {
    if (this.websocketGateway) {
      this.websocketGateway.emitEvent('csv:completed', {
        type: 'csv:completed',
        userId,
        result,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Override to handle cleanup on worker shutdown.
   */
  async close(): Promise<void> {
    this.logger.log('Closing CSV import worker...');
    await super.close();
  }
}
