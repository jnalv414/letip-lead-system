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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { OutreachService } from '../domain/outreach.service';
import {
  OutreachMessageDto,
  BusinessOutreachResponseDto,
} from './dto/outreach-message.dto';

@ApiTags('Outreach Campaigns')
@Controller('api/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all outreach messages (paginated)',
    description:
      'Returns all outreach messages across all businesses, ordered by most recent first.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of outreach messages',
  })
  getAllMessages(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.outreachService.getAllMessages(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
  }

  @Post(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient role',
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
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.outreachService.getOutreachMessages(id);
  }
}
