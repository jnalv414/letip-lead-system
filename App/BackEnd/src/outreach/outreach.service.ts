
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import axios from 'axios';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateOutreachMessage(businessId: number, regenerate: boolean = false) {
    this.logger.log(`Generating outreach message for business ID: ${businessId}`);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        contacts: {
          where: { is_primary: true },
          take: 1,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Check if message already exists
    if (!regenerate) {
      const existingMessage = await this.prisma.outreach_message.findFirst({
        where: { business_id: businessId },
        orderBy: { generated_at: 'desc' },
      });

      if (existingMessage) {
        this.logger.log(`Using existing message for business ID: ${businessId}`);
        return existingMessage;
      }
    }

    // Generate personalized message using AI
    const messageText = await this.generatePersonalizedMessage(business);

    // Save to database
    const outreachMessage = await this.prisma.outreach_message.create({
      data: {
        business_id: businessId,
        contact_id: business.contacts[0]?.id || null,
        message_text: messageText,
        status: 'generated',
      },
    });

    this.logger.log(`Outreach message generated for business ID: ${businessId}`);
    return outreachMessage;
  }

  async getOutreachMessages(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const messages = await this.prisma.outreach_message.findMany({
      where: { business_id: businessId },
      include: {
        contact: true,
      },
      orderBy: { generated_at: 'desc' },
    });

    return {
      business: {
        id: business.id,
        name: business.name,
        city: business.city,
      },
      messages,
    };
  }

  private async generatePersonalizedMessage(business: any): Promise<string> {
    const apiKey = this.configService.getAbacusAIApiKey();
    if (!apiKey) {
      throw new Error('Abacus AI API key not configured');
    }

    const contactName = business.contacts[0]?.name || 'Business Owner';
    const businessName = business.name;
    const industry = business.industry || 'business';
    const city = business.city || 'your area';

    const prompt = `Write a professional, friendly, and personalized outreach message for a local business owner. 

Context:
- Business Name: ${businessName}
- Industry: ${industry}
- Location: ${city}, New Jersey
- Contact Name: ${contactName}

Purpose:
Invite them to join Le Tip of Western Monmouth, a business networking group in Monmouth County, New Jersey. Le Tip helps local business owners generate quality referrals, build professional relationships, and grow their businesses through weekly networking meetings.

Requirements:
- Keep it concise (150-200 words)
- Personalize based on their business and industry
- Mention specific benefits: quality referrals, professional relationships, business growth
- Include a clear call-to-action
- Professional yet warm and approachable tone
- Do NOT include subject line, just the message body
- Address them by name if available

Generate the message:`;

    try {
      const response = await axios.post(
        'https://apps.abacus.ai/v1/chat/completions',
        {
          messages: [
            {
              role: 'system',
              content: 'You are a professional networking outreach specialist writing personalized invitations for Le Tip business networking group.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      );

      const messageText = response.data.choices[0].message.content.trim();
      this.logger.log(`AI message generated successfully for ${businessName}`);
      return messageText;
    } catch (error) {
      this.logger.error('Error generating AI message:', error.message);
      
      // Fallback template if AI fails
      return this.getFallbackTemplate(businessName, contactName, city);
    }
  }

  private getFallbackTemplate(businessName: string, contactName: string, city: string): string {
    return `Dear ${contactName},

I hope this message finds you well. I'm reaching out to introduce you to Le Tip of Western Monmouth, a premier business networking group serving ${city} and the surrounding Monmouth County area.

As a fellow local business owner, I believe ${businessName} would be a great fit for our community. Our members enjoy:

• Quality referrals from trusted business professionals
• Weekly networking meetings to build lasting relationships
• Exclusive membership (one business per category)
• Opportunities to grow your business through word-of-mouth

We meet weekly to exchange referrals and support each other's business growth. Many of our members have seen significant increases in their customer base through Le Tip connections.

Would you be interested in attending one of our meetings as a guest? I'd be happy to share more details about how Le Tip can benefit ${businessName}.

Looking forward to connecting!

Best regards,
Le Tip of Western Monmouth`;
  }
}
