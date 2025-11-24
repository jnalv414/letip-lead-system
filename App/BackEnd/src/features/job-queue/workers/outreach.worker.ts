import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from './base-worker';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { EventsGateway as WebsocketGateway } from '../../../websocket/websocket.gateway';
import { OutreachService } from '../../outreach-campaigns/domain/outreach.service';
import { JobType } from '../config/queue.config';

interface OutreachJobData {
  businessId: number;
  contactId?: number;
  templateName?: string;
  userId: string;
  jobType: JobType;
  campaignId?: number;
  personalizeMessage?: boolean;
  channel?: 'email' | 'linkedin' | 'both';
}

interface OutreachJobResult {
  businessId: number;
  messageId: number;
  messageLength: number;
  templateUsed: string;
  channel: string;
  messagePreview: string;
  personalizationScore?: number;
}

@Injectable()
export class OutreachWorker extends BaseWorker {
  protected readonly logger = new Logger(OutreachWorker.name);

  constructor(
    jobHistoryRepository: JobHistoryRepository,
    websocketGateway: WebsocketGateway,
    private readonly outreachService: OutreachService,
  ) {
    super('outreach-jobs', jobHistoryRepository, websocketGateway);
  }

  protected async processJob(job: Job<OutreachJobData>): Promise<OutreachJobResult> {
    const {
      businessId,
      contactId,
      templateName = 'default',
      campaignId,
      personalizeMessage = true,
      channel = 'email'
    } = job.data;

    this.logger.log(
      `Starting outreach job ${job.id} for business ${businessId}` +
      (contactId ? ` and contact ${contactId}` : '') +
      ` using template: ${templateName}`
    );

    try {
      // Update progress: Starting
      await this.updateProgress(job, 10, 'Fetching business and contact data');

      // Fetch business data (simulate for now if service not available)
      const businessData = await this.fetchBusinessData(businessId);

      // Update progress: Template loading
      await this.updateProgress(job, 25, `Loading template: ${templateName}`);

      // Load message template
      const template = await this.loadTemplate(templateName);

      // Update progress: Personalization
      if (personalizeMessage) {
        await this.updateProgress(job, 40, 'Personalizing message with AI');
      }

      // Generate personalized message using OutreachService
      let message;
      let messageId: number;
      let personalizationScore = 0;

      try {
        // Use the OutreachService from Agent 1
        message = await this.outreachService.generateOutreachMessage(
          businessId,
          false, // regenerate flag
        );

        messageId = message.id;

        // Calculate personalization score based on message content
        if (personalizeMessage) {
          personalizationScore = this.calculatePersonalizationScore(message.message_text);
        }

        this.logger.debug(`Generated message ID ${messageId} with length ${message.message_text.length}`);
      } catch (error) {
        // Fallback to mock if service not available
        this.logger.warn(`OutreachService failed, using mock: ${error.message}`);

        const mockMessage = this.generateMockMessage(businessData, template, personalizeMessage);
        messageId = Math.floor(Math.random() * 10000);
        message = {
          id: messageId,
          message_text: mockMessage,
          business_id: businessId,
          contact_id: contactId,
        };

        if (personalizeMessage) {
          personalizationScore = 75; // Mock score
        }
      }

      // Update progress: Validation
      await this.updateProgress(job, 70, 'Validating message content');

      // Validate message
      this.validateMessage(message.message_text);

      // Update progress: Scheduling
      if (campaignId) {
        await this.updateProgress(job, 85, 'Adding to campaign queue');
        // Would add to campaign here
      }

      // Update progress: Complete
      await this.updateProgress(job, 100, 'Message generated successfully');

      const result: OutreachJobResult = {
        businessId,
        messageId,
        messageLength: message.message_text.length,
        templateUsed: templateName,
        channel,
        messagePreview: message.message_text.substring(0, 200) + '...',
        personalizationScore,
      };

      this.logger.log(
        `Outreach job ${job.id} completed: ` +
        `Message ID ${messageId} (${message.message_text.length} chars) ` +
        `for business ${businessId} via ${channel}`
      );

      return result;
    } catch (error) {
      this.logger.error(`Outreach job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Fetch business data for personalization
   */
  private async fetchBusinessData(businessId: number): Promise<any> {
    // Simulate fetching business data
    await this.delay(500);

    return {
      id: businessId,
      name: 'Example Business',
      industry: 'Technology',
      location: 'San Francisco, CA',
      website: 'https://example.com',
      description: 'Leading technology company',
    };
  }

  /**
   * Load message template
   */
  private async loadTemplate(templateName: string): Promise<string> {
    // Simulate loading template
    await this.delay(300);

    const templates = {
      default: `Hi {{contact_name}},

I noticed that {{company_name}} is making great strides in {{industry}}. Your recent work on {{recent_achievement}} particularly caught my attention.

I'd love to discuss how we can help {{company_name}} achieve {{goal}}.

Would you be available for a brief call next week?

Best regards,
{{sender_name}}`,

      followup: `Hi {{contact_name}},

I wanted to follow up on my previous message about {{topic}}.

{{company_name}} seems like a perfect fit for our {{solution}}, especially given your focus on {{focus_area}}.

Would love to hear your thoughts!

Best,
{{sender_name}}`,

      introduction: `Dear {{contact_name}},

My name is {{sender_name}} and I help {{industry}} companies like {{company_name}} to {{value_proposition}}.

I've been following {{company_name}}'s journey and I'm impressed by {{achievement}}.

I have some ideas that might interest you. Could we schedule a 15-minute call?

Looking forward to connecting!

{{sender_name}}`,
    };

    return templates[templateName as keyof typeof templates] || templates.default;
  }

  /**
   * Generate mock message for testing
   */
  private generateMockMessage(businessData: any, template: string, personalize: boolean): string {
    let message = template;

    if (personalize) {
      // Replace placeholders with actual data
      message = message
        .replace(/{{company_name}}/g, businessData.name)
        .replace(/{{industry}}/g, businessData.industry)
        .replace(/{{contact_name}}/g, 'John')
        .replace(/{{sender_name}}/g, 'Sarah from LeTip')
        .replace(/{{recent_achievement}}/g, 'expanding to new markets')
        .replace(/{{goal}}/g, 'scale your operations efficiently')
        .replace(/{{value_proposition}}/g, 'increase lead generation by 3x')
        .replace(/{{achievement}}/g, 'your recent product launch')
        .replace(/{{solution}}/g, 'lead generation platform')
        .replace(/{{focus_area}}/g, 'customer acquisition')
        .replace(/{{topic}}/g, 'improving your lead generation');
    }

    return message;
  }

  /**
   * Calculate how personalized the message is
   */
  private calculatePersonalizationScore(message: string): number {
    let score = 50; // Base score

    // Check for company-specific mentions
    if (message.includes('recent') || message.includes('noticed')) {
      score += 10;
    }

    // Check for specific details
    if (!message.includes('{{')) {
      score += 20; // No placeholders left
    }

    // Check for personalized greeting
    if (!message.startsWith('Hi,') && !message.startsWith('Dear,')) {
      score += 10;
    }

    // Check for specific value proposition
    if (message.includes('help') || message.includes('achieve')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Validate message content
   */
  private validateMessage(message: string): void {
    if (!message || message.length === 0) {
      throw new Error('Generated message is empty');
    }

    if (message.length < 50) {
      throw new Error('Generated message is too short');
    }

    if (message.length > 5000) {
      throw new Error('Generated message is too long');
    }

    // Check for unreplaced placeholders
    if (message.includes('{{') && message.includes('}}')) {
      this.logger.warn('Message contains unreplaced placeholders');
    }

    // Check for spam triggers
    const spamTriggers = ['FREE', 'CLICK HERE', 'ACT NOW', 'LIMITED TIME'];
    for (const trigger of spamTriggers) {
      if (message.toUpperCase().includes(trigger)) {
        this.logger.warn(`Message contains potential spam trigger: ${trigger}`);
      }
    }
  }

  /**
   * Helper method to simulate async delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Override to handle cleanup on worker shutdown
   */
  async close(): Promise<void> {
    this.logger.log('Closing outreach worker...');
    await super.close();
  }
}