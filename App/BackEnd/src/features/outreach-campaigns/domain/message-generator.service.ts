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
   * Extract the best available contact name.
   * Priority: primary contact name > any contact name > personalized business fallback
   */
  private extractContactName(business: Business): string {
    if (business.contacts && business.contacts.length > 0) {
      // Try primary contact first, then any contact with a name
      const primary = business.contacts.find(c => c.is_primary && c.name);
      if (primary?.name) return primary.name;

      const anyNamed = business.contacts.find(c => c.name);
      if (anyNamed?.name) return anyNamed.name;
    }

    // Use the business name for a more personalized fallback
    // e.g. "Team at Antonio & Sons Plumbing" instead of generic "Business Owner"
    return `Team at ${business.name}`;
  }
}
