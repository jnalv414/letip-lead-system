import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '../../config/config.service';
import {
  SendEmailDto,
  EmailResponseDto,
  BatchEmailResponseDto,
} from './dto/send-email.dto';
import { EmailStatus } from './dto/email-event.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Email configuration options
 */
export interface EmailConfig {
  /** Sender email address */
  fromEmail: string;
  /** Sender name */
  fromName: string;
  /** Reply-to email address */
  replyTo?: string;
  /** Enable click tracking */
  trackClicks?: boolean;
  /** Enable open tracking */
  trackOpens?: boolean;
}

/**
 * Default email configuration for Le Tip outreach
 */
const DEFAULT_CONFIG: EmailConfig = {
  fromEmail: 'outreach@letip-westernmonmouth.com',
  fromName: 'Le Tip of Western Monmouth',
  replyTo: 'info@letip-westernmonmouth.com',
  trackClicks: true,
  trackOpens: true,
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;
  private config: EmailConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.config = DEFAULT_CONFIG;
  }

  /**
   * Initialize SendGrid on module startup
   */
  onModuleInit() {
    const apiKey = this.configService.getSendGridApiKey();

    if (!apiKey) {
      this.logger.warn(
        'SendGrid API key not configured - email sending will be disabled',
      );
      this.logger.warn(
        'Add sendgrid.api_key to ~/.config/letip_api_secrets.json or set SENDGRID_API_KEY env var',
      );
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isConfigured = true;
    this.logger.log('SendGrid email service initialized successfully');
  }

  /**
   * Check if email service is properly configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Update email configuration
   */
  setConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a single email
   *
   * @param dto - Email details
   * @returns Send result with success status and message ID
   *
   * @side-effects
   * - Updates outreach_message.status if messageId provided
   * - Updates outreach_message.sent_at timestamp
   */
  async send(dto: SendEmailDto): Promise<EmailResponseDto> {
    if (!this.isConfigured) {
      this.logger.warn('Email send attempted but SendGrid not configured');
      return {
        success: false,
        error: 'Email service not configured',
        businessId: dto.businessId,
        outreachMessageId: dto.messageId,
      };
    }

    try {
      const msg: sgMail.MailDataRequired = {
        to: {
          email: dto.to.email,
          name: dto.to.name,
        },
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        replyTo: this.config.replyTo,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        trackingSettings: {
          clickTracking: {
            enable: this.config.trackClicks,
          },
          openTracking: {
            enable: this.config.trackOpens,
          },
        },
        // Custom arguments for webhook tracking
        customArgs: {
          businessId: dto.businessId?.toString(),
          outreachMessageId: dto.messageId?.toString(),
        },
      };

      const [response] = await sgMail.send(msg);

      // Extract message ID from headers
      const messageId =
        response.headers['x-message-id'] ||
        response.headers['X-Message-Id'] ||
        undefined;

      this.logger.log(
        `Email sent successfully to ${dto.to.email} (msgId: ${messageId})`,
      );

      // Update outreach message status if tracking
      if (dto.messageId) {
        await this.updateMessageStatus(dto.messageId, 'sent', messageId);
      }

      return {
        success: true,
        messageId,
        businessId: dto.businessId,
        outreachMessageId: dto.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${dto.to.email}`, error);

      // Update outreach message status to failed
      if (dto.messageId) {
        await this.updateMessageStatus(dto.messageId, 'failed');
      }

      return {
        success: false,
        error: errorMessage,
        businessId: dto.businessId,
        outreachMessageId: dto.messageId,
      };
    }
  }

  /**
   * Send multiple emails in batch
   *
   * @param emails - Array of emails to send
   * @returns Batch result with success/failure counts
   *
   * @note Rate limited to respect SendGrid limits (100/sec for paid, lower for free)
   */
  async sendBatch(emails: SendEmailDto[]): Promise<BatchEmailResponseDto> {
    if (!this.isConfigured) {
      return {
        total: emails.length,
        sent: 0,
        failed: emails.length,
        results: emails.map((e) => ({
          success: false,
          error: 'Email service not configured',
          businessId: e.businessId,
          outreachMessageId: e.messageId,
        })),
      };
    }

    const results: EmailResponseDto[] = [];
    let sent = 0;
    let failed = 0;

    // Process emails with rate limiting (10 per second for free tier safety)
    for (let i = 0; i < emails.length; i++) {
      const result = await this.send(emails[i]);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limit: 100ms delay between sends (10/second)
      if (i < emails.length - 1) {
        await this.delay(100);
      }
    }

    this.logger.log(
      `Batch send complete: ${sent} sent, ${failed} failed out of ${emails.length}`,
    );

    return {
      total: emails.length,
      sent,
      failed,
      results,
    };
  }

  /**
   * Update outreach message status and sent timestamp
   */
  async updateMessageStatus(
    messageId: number,
    status: EmailStatus,
    sendgridMessageId?: string,
  ): Promise<void> {
    try {
      const updateData: {
        status: string;
        sent_at?: Date;
      } = {
        status,
      };

      // Set sent_at only when first sent
      if (status === 'sent') {
        updateData.sent_at = new Date();
      }

      await this.prisma.outreach_message.update({
        where: { id: messageId },
        data: updateData,
      });

      this.logger.debug(`Updated message ${messageId} status to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update message ${messageId} status`,
        error,
      );
    }
  }

  /**
   * Handle SendGrid webhook event and update message status
   */
  async handleWebhookEvent(
    event: string,
    email: string,
    messageId?: number,
  ): Promise<void> {
    if (!messageId) {
      this.logger.debug(
        `Received ${event} event for ${email} but no messageId to track`,
      );
      return;
    }

    // Map SendGrid event to our status
    const statusMap: Record<string, EmailStatus> = {
      processed: 'sent',
      dropped: 'failed',
      delivered: 'delivered',
      deferred: 'pending',
      bounce: 'bounced',
      open: 'opened',
      click: 'clicked',
      spamreport: 'spam',
      unsubscribe: 'unsubscribed',
    };

    const newStatus = statusMap[event];
    if (newStatus) {
      await this.updateMessageStatus(messageId, newStatus);
    }
  }

  /**
   * Get email sending statistics
   */
  async getStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  }> {
    const stats = await this.prisma.outreach_message.groupBy({
      by: ['status'],
      _count: true,
    });

    const result = {
      total: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
    };

    for (const stat of stats) {
      result.total += stat._count;
      const status = stat.status as keyof typeof result;
      if (status in result) {
        result[status] = stat._count;
      }
    }

    return result;
  }

  /**
   * Simple delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
