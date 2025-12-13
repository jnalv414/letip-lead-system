import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

/**
 * SendGrid webhook event types
 * @see https://docs.sendgrid.com/for-developers/tracking-events/event
 */
export type SendGridEventType =
  | 'processed'
  | 'dropped'
  | 'delivered'
  | 'deferred'
  | 'bounce'
  | 'open'
  | 'click'
  | 'spamreport'
  | 'unsubscribe'
  | 'group_unsubscribe'
  | 'group_resubscribe';

export class SendGridEventDto {
  @ApiProperty({
    description: 'Event type from SendGrid',
    example: 'delivered',
    enum: [
      'processed',
      'dropped',
      'delivered',
      'deferred',
      'bounce',
      'open',
      'click',
      'spamreport',
      'unsubscribe',
      'group_unsubscribe',
      'group_resubscribe',
    ],
  })
  @IsString()
  event: SendGridEventType;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'john@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Unix timestamp of the event',
    example: 1702500000,
  })
  @IsNumber()
  timestamp: number;

  @ApiPropertyOptional({
    description: 'SendGrid message ID (sg_message_id)',
    example: 'abc123.xyz789',
  })
  @IsOptional()
  @IsString()
  sg_message_id?: string;

  @ApiPropertyOptional({
    description: 'Reason for bounce/drop',
    example: 'Bounced Address',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Bounce type (bounce events only)',
    example: 'hard',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'URL clicked (click events only)',
    example: 'https://example.com/signup',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'User agent (open/click events)',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  useragent?: string;

  @ApiPropertyOptional({
    description: 'IP address (open/click events)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({
    description: 'Custom arguments passed when sending',
  })
  @IsOptional()
  businessId?: number;

  @ApiPropertyOptional({
    description: 'Outreach message ID from custom args',
  })
  @IsOptional()
  outreachMessageId?: number;
}

export class SendGridWebhookPayloadDto {
  @ApiProperty({
    description: 'Array of SendGrid events',
    type: [SendGridEventDto],
  })
  @IsArray()
  events: SendGridEventDto[];
}

/**
 * Internal email status for our system
 */
export type EmailStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed'
  | 'spam';

/**
 * Mapped status from SendGrid events to our internal status
 */
export const SENDGRID_EVENT_TO_STATUS: Record<SendGridEventType, EmailStatus> =
  {
    processed: 'sent',
    dropped: 'failed',
    delivered: 'delivered',
    deferred: 'pending',
    bounce: 'bounced',
    open: 'opened',
    click: 'clicked',
    spamreport: 'spam',
    unsubscribe: 'unsubscribed',
    group_unsubscribe: 'unsubscribed',
    group_resubscribe: 'pending',
  };
