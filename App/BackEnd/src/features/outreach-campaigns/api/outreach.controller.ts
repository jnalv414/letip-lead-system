import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { OutreachService } from '../domain/outreach.service';
import {
  OutreachMessageDto,
  BusinessOutreachResponseDto,
} from './dto/outreach-message.dto';

@ApiTags('Outreach Campaigns')
@Controller('api/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post(':id')
  @ApiOperation({
    summary: 'Generate outreach message for a business',
    description:
      'Generates a personalized outreach message using the Le Tip default template. Returns existing message unless regenerate=true.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Business ID',
    example: 1,
  })
  @ApiQuery({
    name: 'regenerate',
    required: false,
    type: Boolean,
    description: 'Force regeneration of message even if one exists',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Outreach message generated successfully',
    type: OutreachMessageDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  generateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Query('regenerate') regenerate?: string,
  ) {
    return this.outreachService.generateOutreachMessage(
      id,
      regenerate === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get outreach messages for a business',
    description:
      'Returns all outreach messages generated for a specific business, ordered by most recent first.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Business ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of outreach messages with business info',
    type: BusinessOutreachResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.outreachService.getOutreachMessages(id);
  }
}
