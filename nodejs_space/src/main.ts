
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Le Tip Lead System API')
    .setDescription('Business lead scraping, enrichment, and management system for Le Tip of Western Monmouth')
    .setVersion('1.0')
    .addTag('Businesses', 'Business management endpoints')
    .addTag('Scraper', 'Google Maps scraping endpoints')
    .addTag('Enrichment', 'Lead enrichment endpoints')
    .addTag('Outreach', 'Outreach message generation endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Custom CSS for Swagger UI
  const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .information-container { margin: 30px 0; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { 
      font-size: 32px; 
      color: #1a202c;
      font-weight: 700;
    }
    .swagger-ui .info .description { 
      color: #4a5568;
      font-size: 16px;
      line-height: 1.6;
    }
    .swagger-ui .scheme-container { 
      background: #f7fafc; 
      border: 1px solid #e2e8f0;
      padding: 15px;
      border-radius: 8px;
    }
    .swagger-ui .opblock-tag {
      font-size: 20px;
      color: #2d3748;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
      padding: 12px 0;
      margin: 20px 0 10px 0;
    }
    .swagger-ui .opblock {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin: 12px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .swagger-ui .opblock .opblock-summary {
      padding: 12px 20px;
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #48bb78;
      background: rgba(72, 187, 120, 0.05);
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #4299e1;
      background: rgba(66, 153, 225, 0.05);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #f56565;
      background: rgba(245, 101, 101, 0.05);
    }
    .swagger-ui .btn.execute {
      background-color: #4299e1;
      border-color: #4299e1;
      color: white;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 6px;
    }
    .swagger-ui .btn.execute:hover {
      background-color: #3182ce;
      border-color: #3182ce;
    }
    .swagger-ui .response-col_status {
      font-weight: 600;
    }
    .swagger-ui table thead tr th {
      color: #2d3748;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    .swagger-ui .parameter__name {
      font-weight: 600;
      color: #2d3748;
    }
    .swagger-ui .model-title {
      color: #2d3748;
      font-weight: 600;
    }
    body { 
      margin: 0; 
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  `;

  const customSiteTitle = 'Le Tip Lead System API';
  const customfavIcon = 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png';

  SwaggerModule.setup('api-docs', app, document, {
    customCss,
    customSiteTitle,
    customfavIcon,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Le Tip Lead System API                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${port}                    ║
║  API Documentation: http://localhost:${port}/api-docs           ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
