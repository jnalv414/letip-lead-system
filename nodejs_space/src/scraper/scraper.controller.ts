
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ScrapeRequestDto } from './dto/scrape-request.dto';

@ApiTags('Scraper')
@Controller('api/scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  @ApiOperation({ summary: 'Scrape businesses from Google Maps' })
  @ApiResponse({ status: 200, description: 'Scraping initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  scrape(@Body() scrapeRequest: ScrapeRequestDto) {
    return this.scraperService.scrapeGoogleMaps(scrapeRequest);
  }
}
