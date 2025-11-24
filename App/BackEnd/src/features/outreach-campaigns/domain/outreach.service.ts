import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OutreachMessageRepository } from '../data/outreach-message.repository';
import { BusinessRepository } from '../data/business.repository';
import { MessageGeneratorService } from './message-generator.service';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private outreachMessageRepository: OutreachMessageRepository,
    private businessRepository: BusinessRepository,
    private messageGenerator: MessageGeneratorService,
  ) {}

  /**
   * Generate an outreach message for a business
   *
   * @param businessId - Database ID of business to generate message for
   * @param regenerate - Force regeneration even if message exists
   * @returns Generated outreach message
   *
   * @throws {NotFoundException} If business ID doesn't exist
   */
  async generateOutreachMessage(
    businessId: number,
    regenerate: boolean = false,
  ) {
    this.logger.log(
      `Generating outreach message for business ID: ${businessId}`,
    );

    // Fetch business with primary contact
    const business =
      await this.businessRepository.findByIdWithContact(businessId);

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Check if message already exists (unless regenerating)
    if (!regenerate) {
      const existingMessage =
        await this.outreachMessageRepository.findLatestByBusinessId(businessId);

      if (existingMessage) {
        this.logger.log(
          `Using existing message for business ID: ${businessId}`,
        );
        return existingMessage;
      }
    }

    // Generate personalized message using template
    const messageText = await this.messageGenerator.generateMessage(business);

    // Save to database
    const outreachMessage = await this.outreachMessageRepository.create({
      business_id: businessId,
      contact_id: business.contacts[0]?.id || null,
      message_text: messageText,
      status: 'generated',
    });

    this.logger.log(
      `Outreach message generated for business ID: ${businessId}`,
    );
    return outreachMessage;
  }

  /**
   * Get all outreach messages for a business
   *
   * @param businessId - Database ID of business
   * @returns Business info with all outreach messages
   *
   * @throws {NotFoundException} If business ID doesn't exist
   */
  async getOutreachMessages(businessId: number) {
    // Verify business exists
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Fetch all messages for this business
    const messages =
      await this.outreachMessageRepository.findAllByBusinessId(businessId);

    return {
      business: {
        id: business.id,
        name: business.name,
        city: business.city,
      },
      messages,
    };
  }
}
