
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
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';

@ApiTags('Businesses')
@Controller('api/businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of businesses' })
  findAll(@Query() query: QueryBusinessesDto) {
    return this.businessesService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get business statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  getStats() {
    return this.businessesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single business by ID' })
  @ApiResponse({ status: 200, description: 'Business details' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.remove(id);
  }
}
