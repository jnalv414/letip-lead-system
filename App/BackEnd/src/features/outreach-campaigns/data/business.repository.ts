import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BusinessRepository {
  private readonly logger = new Logger(BusinessRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find a business by ID with primary contact
   */
  async findByIdWithContact(businessId: number) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        contacts: {
          where: { is_primary: true },
          take: 1,
        },
      },
    });
  }

  /**
   * Find a business by ID (basic info only)
   */
  async findById(businessId: number) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
    });
  }

  /**
   * Check if a business exists
   */
  async exists(businessId: number): Promise<boolean> {
    const count = await this.prisma.business.count({
      where: { id: businessId },
    });
    return count > 0;
  }
}
