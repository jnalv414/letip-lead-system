import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('service', 'Le Tip Lead System API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('documentation', '/api-docs');
    });
  });
});
