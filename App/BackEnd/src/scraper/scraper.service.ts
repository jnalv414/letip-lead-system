
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ScrapeRequestDto } from './dto/scrape-request.dto';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private prisma: PrismaService,
    private businessesService: BusinessesService,
  ) {}

  async scrapeGoogleMaps(scrapeRequest: ScrapeRequestDto) {
    const { location, radius = 1, business_type, max_results = 50 } = scrapeRequest;
    
    this.logger.log(`Starting Google Maps scrape for ${location}`);
    this.logger.log(`Parameters: radius=${radius}mi, business_type=${business_type || 'all'}, max_results=${max_results}`);

    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Build search query
      const searchQuery = business_type 
        ? `${business_type} near ${location}`
        : `businesses near ${location}`;
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      this.logger.log(`Navigating to: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for results to load
      await page.waitForSelector('div[role="feed"]', { timeout: 30000 });
      await this.delay(3000);

      // Scroll to load more results
      const scrollableDiv = await page.$('div[role="feed"]');
      if (scrollableDiv) {
        for (let i = 0; i < 5; i++) {
          await page.evaluate((div) => {
            div.scrollTop = div.scrollHeight;
          }, scrollableDiv);
          await this.delay(2000);
        }
      }

      // Extract business data
      const businesses = await page.evaluate(() => {
        const results: Array<{
          name: string;
          address: string | null;
          google_maps_url: string | null;
          latitude: number | null;
          longitude: number | null;
        }> = [];
        const items = document.querySelectorAll('div[role="feed"] > div > div > a');
        
        items.forEach((item) => {
          try {
            const nameEl = item.querySelector('div.fontHeadlineSmall');
            const addressEl = item.querySelector('div.fontBodyMedium > div:nth-child(2) span');
            const ratingEl = item.querySelector('span[role="img"]');
            
            if (nameEl) {
              const href = item.getAttribute('href');
              const name = nameEl.textContent?.trim();
              const address = addressEl?.textContent?.trim();
              
              // Extract coordinates from URL
              let latitude = null;
              let longitude = null;
              if (href && href.includes('@')) {
                const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch) {
                  latitude = parseFloat(coordMatch[1]);
                  longitude = parseFloat(coordMatch[2]);
                }
              }
              
              results.push({
                name,
                address: address || null,
                google_maps_url: href ? `https://www.google.com/maps${href}` : null,
                latitude,
                longitude,
              });
            }
          } catch (err) {
            console.error('Error parsing business:', err);
          }
        });
        
        return results;
      });

      await browser.close();

      this.logger.log(`Found ${businesses.length} businesses`);

      // Save to database
      let savedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const business of businesses.slice(0, max_results)) {
        try {
          // Parse city from address
          let city = null;
          if (business.address) {
            const addressParts = business.address.split(',');
            if (addressParts.length >= 2) {
              city = addressParts[addressParts.length - 2]?.trim();
            }
          }

          // Check if business already exists
          const existing = await this.prisma.business.findFirst({
            where: {
              name: business.name,
              address: business.address,
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          await this.businessesService.create({
            name: business.name,
            address: business.address || undefined,
            city: city || undefined,
            state: 'NJ',
            google_maps_url: business.google_maps_url || undefined,
            latitude: business.latitude || undefined,
            longitude: business.longitude || undefined,
            business_type,
          });

          savedCount++;
        } catch (error) {
          this.logger.error(`Error saving business ${business.name}:`, error.message);
          errors.push({ business: business.name, error: error.message });
        }
      }

      this.logger.log(`Scraping complete. Saved: ${savedCount}, Skipped (duplicates): ${skippedCount}`);

      return {
        success: true,
        found: businesses.length,
        saved: savedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Error during scraping:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
