import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BusinessService } from '../domain/business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';

/**
 * Business API controller.
 *
 * Provides REST endpoints for business management:
 * - POST /api/businesses - Create new business
 * - GET /api/businesses - List with filtering/pagination
 * - GET /api/businesses/stats - Get statistics
 * - GET /api/businesses/:id - Get single business
 * - DELETE /api/businesses/:id - Delete business
 *
 * All mutations emit WebSocket events for real-time frontend updates.
 */
@ApiTags('Businesses')
@Controller('api/businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of businesses' })
  findAll(@Query() query: QueryBusinessesDto) {
    return this.businessService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get business statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  getStats() {
    return this.businessService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single business by ID' })
  @ApiResponse({ status: 200, description: 'Business details' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessService.remove(id);
  }
}
