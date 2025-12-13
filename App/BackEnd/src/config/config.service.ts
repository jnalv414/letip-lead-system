
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface SecretValue {
  value: string;
}

interface ServiceSecrets {
  secrets: {
    [key: string]: SecretValue;
  };
}

interface SecretsFile {
  [serviceName: string]: ServiceSecrets;
}

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private secrets: SecretsFile = {};

  constructor(private nestConfigService: NestConfigService) {
    this.loadSecrets();
  }

  private loadSecrets() {
    try {
      const secretsPath = path.join(
        process.env.HOME || '/home/ubuntu',
        '.config',
        'letip_api_secrets.json',
      );

      if (fs.existsSync(secretsPath)) {
        const secretsContent = fs.readFileSync(secretsPath, 'utf-8');
        this.secrets = JSON.parse(secretsContent);
        this.logger.log('API secrets loaded successfully');
      } else {
        this.logger.warn(`Secrets file not found at ${secretsPath}`);
      }
    } catch (error) {
      this.logger.error('Error loading secrets file:', error);
    }
  }

  get(key: string): string | undefined {
    return this.nestConfigService.get<string>(key);
  }

  getSecret(serviceName: string, secretName: string): string | null {
    try {
      const service = this.secrets[serviceName];
      if (service && service.secrets && service.secrets[secretName]) {
        return service.secrets[secretName].value;
      }
      this.logger.warn(
        `Secret not found: ${serviceName}.${secretName}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error retrieving secret ${serviceName}.${secretName}:`,
        error,
      );
      return null;
    }
  }

  // Specific getters for easy access
  getHunterApiKey(): string | null {
    return this.getSecret('hunter.io', 'api_key');
  }

  getAbstractApiKey(): string | null {
    return this.getSecret('abstractapi', 'api_key');
  }

  getSendGridApiKey(): string | null {
    // First check environment variable, then secrets file
    const envKey = this.nestConfigService.get<string>('SENDGRID_API_KEY');
    if (envKey) {
      return envKey;
    }
    return this.getSecret('sendgrid', 'api_key');
  }

  getDatabaseUrl(): string | undefined {
    return this.nestConfigService.get<string>('DATABASE_URL');
  }

  getPort(): number {
    return parseInt(this.nestConfigService.get<string>('PORT', '3000'), 10);
  }
}
