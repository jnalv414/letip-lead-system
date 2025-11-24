import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import axios, { AxiosInstance } from 'axios';

export interface HunterEmailResult {
  emails: Array<{
    value: string;
    type: string;
    confidence: number;
    first_name?: string;
    last_name?: string;
    position?: string;
    seniority?: string;
    verification?: {
      status: string;
    };
  }>;
  domain: string;
  organization: string;
}

@Injectable()
export class HunterApiClientService {
  private readonly logger = new Logger(HunterApiClientService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getHunterApiKey();

    if (!this.apiKey) {
      this.logger.warn('Hunter.io API key not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.hunter.io/v2',
      timeout: 10000,
    });
  }

  /**
   * Search for emails associated with a domain.
   *
   * @param domain - Domain to search (e.g., 'example.com')
   * @param limit - Maximum number of emails to retrieve (default 5)
   * @returns Email results from Hunter.io
   * @throws Error if API call fails
   */
  async searchDomain(domain: string, limit: number = 5): Promise<HunterEmailResult> {
    if (!this.isConfigured()) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/domain-search', {
        params: {
          domain,
          api_key: this.apiKey,
          limit,
        },
      });

      return {
        emails: response.data.data.emails || [],
        domain: response.data.data.domain,
        organization: response.data.data.organization || '',
      };
    } catch (error) {
      this.logger.error(`Hunter.io API error for ${domain}:`, error.message);
      throw new Error(`Hunter.io API failed: ${error.message}`);
    }
  }

  /**
   * Verify if API key is configured.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}