import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface CreateEnrichmentLogDto {
  business_id: number;
  service: 'hunter' | 'abstract';
  status: 'success' | 'failed';
  request_data?: any;
  response_data?: any;
  error_message?: string;
}

@Injectable()
export class EnrichmentLogRepository {
  private readonly logger = new Logger(EnrichmentLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create enrichment log entry.
   */
  async create(data: CreateEnrichmentLogDto) {
    return this.prisma.enrichment_log.create({
      data: {
        ...data,
        created_at: new Date(),
      },
    });
  }

  /**
   * Get logs by business ID.
   */
  async findByBusinessId(businessId: number) {
    return this.prisma.enrichment_log.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get logs by service.
   */
  async findByService(service: string) {
    return this.prisma.enrichment_log.findMany({
      where: { service },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  /**
   * Get success rate for a service.
   */
  async getSuccessRate(service: string): Promise<number> {
    const [total, successful] = await Promise.all([
      this.prisma.enrichment_log.count({ where: { service } }),
      this.prisma.enrichment_log.count({
        where: { service, status: 'success' },
      }),
    ]);

    return total > 0 ? (successful / total) * 100 : 0;
  }
}