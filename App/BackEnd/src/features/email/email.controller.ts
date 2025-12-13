import {
  Controller,
  Post,
  Body,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendGridEventDto } from './dto/email-event.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/email')
@ApiTags('Email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * SendGrid webhook endpoint
   * Receives delivery events (delivered, opened, clicked, bounced, etc.)
   *
   * @note This endpoint is public (no auth) as SendGrid needs to call it
   * @see https://docs.sendgrid.com/for-developers/tracking-events/event
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'SendGrid webhook endpoint',
    description:
      'Receives email delivery events from SendGrid. This endpoint is called automatically by SendGrid when email events occur.',
  })
  @ApiResponse({
    status: 200,
    description: 'Events processed successfully',
  })
  async handleWebhook(@Body() events: SendGridEventDto[]): Promise<void> {
    this.logger.log(`Received ${events.length} webhook events from SendGrid`);

    for (const event of events) {
      try {
        await this.emailService.handleWebhookEvent(
          event.event,
          event.email,
          event.outreachMessageId,
        );

        this.logger.debug(
          `Processed ${event.event} event for ${event.email}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process webhook event: ${event.event} for ${event.email}`,
          error,
        );
      }
    }
  }

  /**
   * Get email sending statistics
   */
  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get email statistics',
    description:
      'Returns counts of emails by status (sent, delivered, opened, clicked, bounced, failed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Email statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 100 },
        sent: { type: 'number', example: 95 },
        delivered: { type: 'number', example: 90 },
        opened: { type: 'number', example: 45 },
        clicked: { type: 'number', example: 20 },
        bounced: { type: 'number', example: 3 },
        failed: { type: 'number', example: 2 },
      },
    },
  })
  async getStats() {
    return this.emailService.getStats();
  }

  /**
   * Check if email service is configured
   */
  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check email service status',
    description:
      'Returns whether the email service is properly configured with SendGrid',
  })
  @ApiResponse({
    status: 200,
    description: 'Email service status',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean', example: true },
        provider: { type: 'string', example: 'SendGrid' },
      },
    },
  })
  async getStatus() {
    return {
      configured: this.emailService.isEnabled(),
      provider: 'SendGrid',
    };
  }
}
