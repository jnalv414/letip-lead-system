import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Business data access layer following repository pattern.
 *
 * Responsibilities:
 * - All direct Prisma database operations for business entity
 * - Query building and optimization
 * - Related data inclusion (contacts, enrichment_logs, outreach_messages)
 *
 * Does NOT:
 * - Handle caching (domain/business-cache.service.ts)
 * - Emit WebSocket events (domain/business.service.ts)
 * - Business logic or validation (domain/business.service.ts)
 */
@Injectable()
export class BusinessRepository {
  private readonly logger = new Logger(BusinessRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new business record.
   *
   * @param data - Business creation data
   * @returns Created business entity
   */
  async create(data: Prisma.businessCreateInput) {
    const business = await this.prisma.business.create({
      data,
    });

    this.logger.debug(`Created business: ${business.id} - ${business.name}`);
    return business;
  }

  /**
   * Find all businesses with filtering and pagination.
   *
   * @param where - Filter conditions
   * @param skip - Number of records to skip (for pagination)
   * @param take - Number of records to take (page size)
   * @returns Tuple of [businesses array, total count]
   */
  async findAll(
    where: Prisma.businessWhereInput,
    skip: number,
    take: number,
  ): Promise<[any[], number]> {
    return Promise.all([
      this.prisma.business.findMany({
        where,
        skip,
        take,
        include: {
          contacts: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);
  }

  /**
   * Find a single business by ID with all related data.
   *
   * @param id - Business ID
   * @returns Business with contacts, enrichment logs, and outreach messages
   */
  async findOne(id: number) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        contacts: true,
        enrichment_logs: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        outreach_messages: {
          orderBy: { generated_at: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Delete a business by ID.
   *
   * Cascade deletes:
   * - All related contacts
   * - All enrichment logs
   * - All outreach messages
   *
   * @param id - Business ID
   * @returns Deleted business entity
   */
  async delete(id: number) {
    return this.prisma.business.delete({
      where: { id },
    });
  }

  /**
   * Get comprehensive business statistics.
   *
   * Queries:
   * - Total businesses count
   * - Enriched businesses count
   * - Pending enrichment count
   * - Total contacts count
   * - Messages sent count
   * - Messages pending count
   *
   * @returns Statistics object
   */
  async getStats() {
    const [
      total,
      enriched,
      pending,
      totalContacts,
      messagesSent,
      messagesPending,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { enrichment_status: 'enriched' } }),
      this.prisma.business.count({ where: { enrichment_status: 'pending' } }),
      this.prisma.contact.count(),
      this.prisma.outreach_message.count({ where: { status: 'sent' } }),
      this.prisma.outreach_message.count({ where: { status: 'draft' } }),
    ]);

    return {
      totalBusinesses: total,
      enrichedBusinesses: enriched,
      pendingEnrichment: pending,
      totalContacts,
      messagesSent,
      messagesPending,
    };
  }

  /**
   * Check if a business exists by ID.
   *
   * @param id - Business ID
   * @returns True if business exists, false otherwise
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.business.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Update a business record.
   *
   * @param id - Business ID
   * @param data - Update data
   * @returns Updated business entity
   */
  async update(id: number, data: Prisma.businessUpdateInput) {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }
}
