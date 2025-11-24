import { ApiProperty } from '@nestjs/swagger';

export class OutreachMessageDto {
  @ApiProperty({
    description: 'Unique identifier for the outreach message',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Business ID this message is for',
    example: 123,
  })
  business_id: number;

  @ApiProperty({
    description: 'Contact ID (if associated with a specific contact)',
    example: 45,
    nullable: true,
  })
  contact_id: number | null;

  @ApiProperty({
    description: 'Generated message text',
    example: 'Dear John,\n\nI hope this message finds you well...',
  })
  message_text: string;

  @ApiProperty({
    description: 'Message status',
    example: 'generated',
    enum: ['generated', 'sent', 'failed'],
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp when the message was generated',
    example: '2025-01-21T15:30:00.000Z',
  })
  generated_at: Date;
}

export class BusinessOutreachResponseDto {
  @ApiProperty({
    description: 'Business information',
  })
  business: {
    id: number;
    name: string;
    city: string | null;
  };

  @ApiProperty({
    description: 'List of outreach messages for this business',
    type: [OutreachMessageDto],
  })
  messages: OutreachMessageDto[];
}
