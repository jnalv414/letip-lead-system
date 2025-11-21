
import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Le Tip Lead System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 60px 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    h1 {
      color: #2d3748;
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #718096;
      font-size: 1.1em;
      margin-bottom: 40px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 1.1em;
      font-weight: 600;
      margin: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .info {
      margin-top: 40px;
      padding: 20px;
      background: #f7fafc;
      border-radius: 10px;
      color: #4a5568;
    }
    .info strong {
      color: #2d3748;
    }
    .status {
      display: inline-block;
      padding: 5px 15px;
      background: #48bb78;
      color: white;
      border-radius: 20px;
      font-size: 0.9em;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 Le Tip Lead System</h1>
    <p class="subtitle">Lead Management & Outreach Platform</p>
    
    <div>
      <a href="/api-docs" class="button">📚 API Documentation</a>
    </div>
    
    <div class="info">
      <strong>WebSocket:</strong> Real-time updates enabled<br>
      <strong>Database:</strong> PostgreSQL (Prisma)<br>
      <strong>Enrichment:</strong> Hunter.io API<br>
      <strong>Features:</strong> Google Maps Scraping, Lead Enrichment, AI Outreach
    </div>
    
    <div class="status">✅ API Online</div>
  </div>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }
}
