import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import axios, { AxiosInstance } from 'axios';

export interface AbstractCompanyResult {
  name: string;
  domain: string;
  country: string;
  locality?: string;
  employees_count?: string;
  industry?: string;
  year_founded?: number;
}

@Injectable()
export class AbstractApiClientService {
  private readonly logger = new Logger(AbstractApiClientService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getAbstractApiKey();

    if (!this.apiKey) {
      this.logger.warn('AbstractAPI key not configured');
    }

    this.client = axios.create({
      baseURL: 'https://companyenrichment.abstractapi.com/v1',
      timeout: 10000,
    });
  }

  /**
   * Enrich company data from domain.
   *
   * @param domain - Company domain (e.g., 'example.com')
   * @returns Company enrichment data
   * @throws Error if API call fails
   */
  async enrichCompany(domain: string): Promise<AbstractCompanyResult> {
    if (!this.isConfigured()) {
      throw new Error('AbstractAPI key not configured');
    }

    try {
      const response = await this.client.get('/', {
        params: {
          api_key: this.apiKey,
          domain,
        },
      });

      return {
        name: response.data.name || '',
        domain: response.data.domain || domain,
        country: response.data.country || '',
        locality: response.data.locality,
        employees_count: response.data.employees_count,
        industry: response.data.industry,
        year_founded: response.data.year_founded,
      };
    } catch (error) {
      this.logger.error(`AbstractAPI error for ${domain}:`, error.message);
      throw new Error(`AbstractAPI failed: ${error.message}`);
    }
  }

  /**
   * Verify if API key is configured.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}