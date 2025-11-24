import { Injectable, Logger } from '@nestjs/common';
import {
  getDefaultTemplate,
  MessageTemplateData,
} from './templates/default-template';

interface Business {
  id: number;
  name: string;
  city?: string | null;
  contacts?: Array<{
    id: number;
    name?: string | null;
    is_primary?: boolean | null;
  }>;
}

@Injectable()
export class MessageGeneratorService {
  private readonly logger = new Logger(MessageGeneratorService.name);

  /**
   * Generate a personalized outreach message for a business
   *
   * @param business - Business data including name, city, and contacts
   * @returns Personalized message text
   */
  async generateMessage(business: Business): Promise<string> {
    const contactName = this.extractContactName(business);
    const businessName = business.name;
    const city = business.city || 'your area';

    this.logger.log(
      `Generating template message for ${businessName} in ${city}`,
    );

    const templateData: MessageTemplateData = {
      contactName,
      businessName,
      city,
    };

    return getDefaultTemplate(templateData);
  }

  /**
   * Extract the primary contact name or use default
   */
  private extractContactName(business: Business): string {
    if (business.contacts && business.contacts.length > 0) {
      const primaryContact = business.contacts[0];
      if (primaryContact.name) {
        return primaryContact.name;
      }
    }
    return 'Business Owner';
  }
}
