import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OutreachMessageRepository {
  private readonly logger = new Logger(OutreachMessageRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find the most recent outreach message for a business
   */
  async findLatestByBusinessId(businessId: number) {
    return this.prisma.outreach_message.findFirst({
      where: { business_id: businessId },
      orderBy: { generated_at: 'desc' },
    });
  }

  /**
   * Find all outreach messages for a business
   */
  async findAllByBusinessId(businessId: number) {
    return this.prisma.outreach_message.findMany({
      where: { business_id: businessId },
      include: {
        contact: true,
      },
      orderBy: { generated_at: 'desc' },
    });
  }

  /**
   * Create a new outreach message
   */
  async create(data: {
    business_id: number;
    contact_id: number | null;
    message_text: string;
    status: string;
  }) {
    const createData: Prisma.outreach_messageCreateInput = {
      business: {
        connect: { id: data.business_id },
      },
      contact: data.contact_id
        ? { connect: { id: data.contact_id } }
        : undefined,
      message_text: data.message_text,
      status: data.status,
    };

    const message = await this.prisma.outreach_message.create({
      data: createData,
    });

    this.logger.debug(
      `Created outreach message: ${message.id} for business: ${data.business_id}`,
    );
    return message;
  }

  /**
   * Update an existing outreach message
   */
  async update(
    id: number,
    data: Partial<{
      message_text: string;
      status: string;
    }>,
  ) {
    return this.prisma.outreach_message.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an outreach message
   */
  async delete(id: number) {
    return this.prisma.outreach_message.delete({
      where: { id },
    });
  }

  /**
   * Get count of outreach messages by status
   */
  async getCountByStatus() {
    const [generated, sent, failed] = await Promise.all([
      this.prisma.outreach_message.count({ where: { status: 'generated' } }),
      this.prisma.outreach_message.count({ where: { status: 'sent' } }),
      this.prisma.outreach_message.count({ where: { status: 'failed' } }),
    ]);

    return {
      generated,
      sent,
      failed,
      total: generated + sent + failed,
    };
  }
}
