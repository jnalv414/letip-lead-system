import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
