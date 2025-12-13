import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmailRecipientDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Recipient name for personalization',
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Email recipient',
    type: EmailRecipientDto,
  })
  @ValidateNested()
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Exclusive Business Networking Opportunity',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Plain text email body',
    example: 'Dear John, I hope this message finds you well...',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'HTML email body (optional)',
    example: '<p>Dear John,</p><p>I hope this message finds you well...</p>',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Business ID this email is associated with',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  businessId?: number;

  @ApiPropertyOptional({
    description: 'Outreach message ID this email is associated with',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  messageId?: number;
}

export class SendBatchEmailDto {
  @ApiProperty({
    description: 'Array of emails to send',
    type: [SendEmailDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  emails: SendEmailDto[];
}

export class EmailResponseDto {
  @ApiProperty({
    description: 'Whether the email was sent successfully',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'SendGrid message ID for tracking',
    example: 'abc123xyz',
  })
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Error message if send failed',
    example: 'Invalid email address',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Associated business ID',
    example: 123,
  })
  businessId?: number;

  @ApiPropertyOptional({
    description: 'Associated outreach message ID',
    example: 456,
  })
  outreachMessageId?: number;
}

export class BatchEmailResponseDto {
  @ApiProperty({
    description: 'Total emails attempted',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Successfully sent count',
    example: 9,
  })
  sent: number;

  @ApiProperty({
    description: 'Failed send count',
    example: 1,
  })
  failed: number;

  @ApiProperty({
    description: 'Individual results',
    type: [EmailResponseDto],
  })
  results: EmailResponseDto[];
}
