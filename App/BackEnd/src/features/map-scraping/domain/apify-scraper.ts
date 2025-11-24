import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ApifyActorInput {
  searchStringsArray: string[];
  maxCrawledPlacesPerSearch?: number;
  language?: string;
  reviewsSort?: 'newest' | 'mostRelevant' | 'highestRating' | 'lowestRating';
  includeWebResults?: boolean;
  includeImagesFromGoogleSearch?: boolean;
}

export interface ApifyPlaceResult {
  title: string;
  description?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;
  phone?: string;
  website?: string;
  email?: string;
  location?: {
    lat: number;
    lng: number;
  };
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  totalScore?: number;
  reviewsCount?: number;
  reviewsDistribution?: Record<string, number>;
  imagesCount?: number;
  additionalInfo?: Record<string, any>;
  price?: string;
  menu?: string;
  reserveTableUrl?: string;
  googleMapsUrl?: string;
  url?: string;
  cid?: string;
  placeId?: string;
  openingHours?: string[];
  peopleAlsoSearch?: any[];
  placesTags?: string[];
  additionalCategories?: string[];
  imageUrls?: string[];
}

export interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt?: string;
    defaultDatasetId: string;
  };
}

@Injectable()
export class ApifyScraper {
  private readonly logger = new Logger(ApifyScraper.name);
  private readonly client: AxiosInstance;
  private readonly actorId = 'compass/google-maps-scraper';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    // Load API key from secrets file via ConfigService
    this.apiKey = this.configService.get('APIFY_API_KEY') ||
                  process.env.APIFY_API_KEY ||
                  '';

    if (!this.apiKey) {
      this.logger.warn('Apify API key not configured - scraping will fail');
    }

    this.client = axios.create({
      baseURL: 'https://api.apify.com/v2',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        token: this.apiKey,
      },
    });
  }

  /**
   * Starts an Apify actor run for Google Maps scraping
   * @param searchQuery - The search query for Google Maps
   * @param maxResults - Maximum number of results to fetch
   * @returns The Apify run ID
   */
  async startScraping(searchQuery: string, maxResults: number = 50): Promise<string> {
    try {
      const input: ApifyActorInput = {
        searchStringsArray: [searchQuery],
        maxCrawledPlacesPerSearch: maxResults,
        language: 'en',
        reviewsSort: 'mostRelevant',
        includeWebResults: true,
        includeImagesFromGoogleSearch: false,
      };

      this.logger.log(`Starting Apify actor run for query: ${searchQuery}`);

      const response = await this.client.post<ApifyRunResponse>(
        `/acts/${this.actorId}/runs`,
        input
      );

      const runId = response.data.data.id;
      this.logger.log(`Apify actor run started with ID: ${runId}`);

      return runId;
    } catch (error) {
      this.logger.error('Failed to start Apify actor:', error);
      throw error;
    }
  }

  /**
   * Get the status of an Apify actor run
   */
  async getRunStatus(runId: string): Promise<{ status: string; itemCount: number }> {
    try {
      const response = await this.client.get(`/actor-runs/${runId}`);
      const { status, stats } = response.data.data;

      return {
        status,
        itemCount: stats?.outputItemCount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get run status for ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch results from a completed Apify actor run
   */
  async getResults(runId: string): Promise<ApifyPlaceResult[]> {
    try {
      const response = await this.client.get(
        `/actor-runs/${runId}/dataset/items`,
        {
          params: {
            format: 'json',
            clean: true,
          },
        }
      );

      return response.data as ApifyPlaceResult[];
    } catch (error) {
      this.logger.error(`Failed to get results for run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for an Apify run to complete and return results
   */
  async waitForCompletion(
    runId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<ApifyPlaceResult[]> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const { status } = await this.getRunStatus(runId);

      if (status === 'SUCCEEDED') {
        this.logger.log(`Run ${runId} completed successfully`);
        return this.getResults(runId);
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Apify run ${runId} failed with status: ${status}`);
      }

      this.logger.debug(`Run ${runId} status: ${status}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Apify run ${runId} timed out after ${maxWaitTime}ms`);
  }

  /**
   * Transform Apify results to our business entity format
   */
  transformResult(place: ApifyPlaceResult): any {
    return {
      name: place.title,
      address: place.address,
      city: place.city,
      state: place.state || 'NJ',
      phone: place.phone,
      website: place.website,
      email: place.email,
      google_maps_url: place.googleMapsUrl || place.url,
      google_place_id: place.placeId,
      latitude: place.location?.lat,
      longitude: place.location?.lng,
      business_type: place.categoryName,
      additional_categories: place.additionalCategories,
      rating: place.totalScore,
      review_count: place.reviewsCount,
      price_level: place.price,
      temporarily_closed: place.temporarilyClosed,
      permanently_closed: place.permanentlyClosed,
      raw_data: JSON.stringify(place.additionalInfo || {}),
    };
  }
}