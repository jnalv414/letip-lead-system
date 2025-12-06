import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ScraperService } from '../domain/scraper.service';
import { ScrapeRequestDto } from './dto/scrape-request.dto';
import { ScrapeStatusDto } from './dto/scrape-status.dto';

@ApiTags('Map Scraping')
@Controller('api/scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start scraping businesses from Google Maps',
    description: 'Initiates an Apify actor run to scrape business data from Google Maps'
  })
  @ApiResponse({ status: 200, description: 'Scraping initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  async startScraping(@Body() scrapeRequest: ScrapeRequestDto) {
    return this.scraperService.startScraping(scrapeRequest);
  }

  @Get('status/:runId')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check scraping job status',
    description: 'Returns the current status of an Apify actor run'
  })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully', type: ScrapeStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Run ID not found' })
  async getScrapingStatus(@Param('runId') runId: string) {
    return this.scraperService.getScrapingStatus(runId);
  }
}