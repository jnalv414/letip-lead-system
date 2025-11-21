
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto) {
    try {
      const business = await this.prisma.business.create({
        data: createBusinessDto,
      });
      this.logger.log(`Created business: ${business.name} (ID: ${business.id})`);
      return business;
    } catch (error) {
      this.logger.error('Error creating business:', error);
      throw error;
    }
  }

  async findAll(query: QueryBusinessesDto) {
    const { city, industry, enrichment_status } = query;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (city) where.city = city;
    if (industry) where.industry = industry;
    if (enrichment_status) where.enrichment_status = enrichment_status;

    try {
      const [businesses, total] = await Promise.all([
        this.prisma.business.findMany({
          where,
          skip,
          take: limit,
          include: {
            contacts: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.business.count({ where }),
      ]);

      return {
        data: businesses,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching businesses:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const business = await this.prisma.business.findUnique({
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

      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }

      return business;
    } catch (error) {
      this.logger.error(`Error fetching business ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const business = await this.prisma.business.delete({
        where: { id },
      });
      this.logger.log(`Deleted business: ${business.name} (ID: ${id})`);
      return { message: 'Business deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting business ${id}:`, error);
      throw new NotFoundException(`Business with ID ${id} not found`);
    }
  }

  async getStats() {
    try {
      const [
        total,
        enriched,
        pending,
        failed,
        byCity,
        byIndustry,
      ] = await Promise.all([
        this.prisma.business.count(),
        this.prisma.business.count({ where: { enrichment_status: 'enriched' } }),
        this.prisma.business.count({ where: { enrichment_status: 'pending' } }),
        this.prisma.business.count({ where: { enrichment_status: 'failed' } }),
        this.prisma.business.groupBy({
          by: ['city'],
          _count: true,
          orderBy: { _count: { city: 'desc' } },
          take: 10,
        }),
        this.prisma.business.groupBy({
          by: ['industry'],
          _count: true,
          where: { industry: { not: null } },
          orderBy: { _count: { industry: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        total,
        enriched,
        pending,
        failed,
        byCity: byCity.map(item => ({
          city: item.city,
          count: item._count,
        })),
        byIndustry: byIndustry.map(item => ({
          industry: item.industry,
          count: item._count,
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching stats:', error);
      throw error;
    }
  }
}
