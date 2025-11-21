
import { Controller, Post, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OutreachService } from './outreach.service';

@ApiTags('Outreach')
@Controller('api/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post(':id')
  @ApiOperation({ summary: 'Generate outreach message for a business' })
  @ApiQuery({ name: 'regenerate', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Outreach message generated' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  generateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Query('regenerate') regenerate?: string,
  ) {
    return this.outreachService.generateOutreachMessage(id, regenerate === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outreach messages for a business' })
  @ApiResponse({ status: 200, description: 'List of outreach messages' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.outreachService.getOutreachMessages(id);
  }
}
