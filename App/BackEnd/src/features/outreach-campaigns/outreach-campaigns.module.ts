import { Module } from '@nestjs/common';
import { OutreachController } from './api/outreach.controller';
import { OutreachService } from './domain/outreach.service';
import { MessageGeneratorService } from './domain/message-generator.service';
import { OutreachMessageRepository } from './data/outreach-message.repository';
import { BusinessRepository } from './data/business.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OutreachController],
  providers: [
    OutreachService,
    MessageGeneratorService,
    OutreachMessageRepository,
    BusinessRepository,
  ],
  exports: [OutreachService],
})
export class OutreachCampaignsModule {}
