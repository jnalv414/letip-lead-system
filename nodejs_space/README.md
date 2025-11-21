
# Le Tip Lead System API

A comprehensive NestJS backend service for business lead scraping, enrichment, and management for Le Tip of Western Monmouth.

## Features

- 🔍 **Google Maps Scraper** - Scrape local businesses from target areas
- 💎 **Lead Enrichment** - Enrich with Hunter.io and AbstractAPI
- ✉️ **AI Outreach Generator** - Generate personalized outreach messages
- 🤖 **Telegram Bot** - Manage system via Telegram commands
- 📊 **REST API** - Full REST API with Swagger documentation
- 🗄️ **PostgreSQL Database** - Store all business and contact data

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Yarn package manager

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables (see `.env.sample`):
```bash
cp .env.sample .env
# Edit .env with your configuration
```

3. Configure API secrets in `/home/ubuntu/.config/abacusai_auth_secrets.json`:
```json
{
  "hunter.io": {
    "secrets": {
      "api_key": { "value": "your_hunter_api_key" }
    }
  },
  "abstractapi": {
    "secrets": {
      "api_key": { "value": "your_abstract_api_key" }
    }
  },
  "telegram": {
    "secrets": {
      "bot_token": { "value": "your_telegram_bot_token" }
    }
  }
}
```

4. Run database migrations:
```bash
yarn prisma generate
yarn prisma db push
```

5. Start the development server:
```bash
yarn start:dev
```

The API will be available at:
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/api-docs

## API Endpoints

### Businesses
- `GET /api/businesses` - List all businesses with pagination and filters
- `GET /api/businesses/:id` - Get single business details
- `GET /api/businesses/stats` - Get statistics
- `POST /api/businesses` - Create new business
- `DELETE /api/businesses/:id` - Delete business

### Scraper
- `POST /api/scrape` - Scrape businesses from Google Maps

### Enrichment
- `POST /api/enrich/:id` - Enrich specific business
- `POST /api/enrich/batch/process` - Batch enrich multiple businesses

### Outreach
- `POST /api/outreach/:id` - Generate outreach message
- `GET /api/outreach/:id` - Get outreach messages

## Telegram Bot Commands

- `/start` - Welcome message and help
- `/stats` - Show statistics
- `/scrape [location]` - Trigger scraping
- `/leads [filters]` - List recent leads
- `/enrich [id]` - Enrich specific business
- `/enrich_batch [count]` - Batch enrich businesses
- `/outreach [id]` - Generate outreach message
- `/export` - Export leads to CSV

## Database Schema

### Tables
- `business` - Business information
- `contact` - Contact information
- `enrichment_log` - Enrichment attempt logs
- `outreach_message` - Generated outreach messages

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Scraping**: Puppeteer
- **Documentation**: Swagger/OpenAPI
- **Bot**: node-telegram-bot-api

## Development

```bash
# Development mode
yarn start:dev

# Build
yarn build

# Production mode
yarn start:prod

# Run tests
yarn test

# E2E tests
yarn test:e2e
```

## License

Private - Le Tip of Western Monmouth
