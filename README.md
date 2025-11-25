
# 🎯 Le Tip Lead Management System

An automated business lead generation, enrichment, and outreach platform built with NestJS, Next.js, and PostgreSQL.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Deployment

- **Dashboard:** /dashboard/
- **API Documentation:** /api-docs
- **Backend API:** http://localhost:3000 (development)

## ✨ Features

### 🔍 **Business Scraping**
- Automated Google Maps scraping
- Configurable search parameters (location, category, radius)
- Real-time progress tracking via WebSocket
- Support for multiple locations

### 📧 **Lead Enrichment**
- Email discovery using Hunter.io API
- Contact information enrichment
- Batch processing capabilities
- Automatic data validation

### 🤖 **AI-Powered Outreach**
- Automated outreach message generation
- Personalized content based on business data
- Multiple templates support
- Campaign management

### 📊 **Dashboard**
- Real-time statistics and analytics
- Business management interface
- Interactive data visualization
- Quick action shortcuts

### 🔔 **Telegram Notifications**
- Real-time scraping updates
- Enrichment progress notifications
- Error alerts
- Custom notification settings

### 🌐 **Real-Time Updates**
- WebSocket integration
- Live progress tracking
- Instant status updates
- Event-driven architecture

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **API Documentation:** Swagger/OpenAPI
- **Real-time:** Socket.io (WebSocket)
- **Queue:** BullMQ for background jobs

### Frontend
- **Framework:** Next.js 16 (React 19.2) - Turbopack stable, Cache Components
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library
- **Build:** Static export for production

### External Services
- **Google Maps:** Business data scraping
- **Hunter.io:** Email enrichment
- **Telegram Bot:** Notifications
- **Notion API:** (Optional) Data management

## 📦 Installation

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database
- Yarn package manager

### Environment Variables

Create a `.env` file in the `App/BackEnd` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/letip_leads"

# Hunter.io API
HUNTER_API_KEY="your_hunter_api_key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"

# Notion (Optional)
NOTION_API_KEY="your_notion_api_key"
```

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jnalv414/letip-lead-system.git
   cd letip-lead-system
   ```

2. **Install backend dependencies:**
   ```bash
   cd App/BackEnd
   yarn install
   ```

3. **Install dashboard dependencies:**
   ```bash
   cd ../FrontEnd
   npm install
   ```

4. **Set up the database:**
   ```bash
   cd ../BackEnd
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Build the dashboard:**
   ```bash
   cd ../FrontEnd
   npm run build
   ```

6. **Start the backend:**
   ```bash
   cd ../BackEnd
   yarn start:dev
   ```

The application will be available at:
- **Dashboard:** http://localhost:3000/dashboard/
- **API:** http://localhost:3000/api
- **API Docs:** http://localhost:3000/api-docs

## 📚 API Endpoints

### Business Management
- `GET /api/businesses` - List all businesses
- `GET /api/businesses/:id` - Get business details
- `DELETE /api/businesses/:id` - Delete a business

### Scraping
- `POST /api/scraper/scrape` - Start scraping businesses
- `GET /api/scraper/status/:jobId` - Check scraping status

### Enrichment
- `POST /api/enrichment/:id` - Enrich a single business
- `POST /api/enrichment/batch` - Batch enrich businesses

### Outreach
- `POST /api/outreach/:id` - Generate outreach message

Full API documentation available at `/api-docs` when running.

## 🏗️ Project Structure

```
letip-lead-system/
├── App/
│   ├── BackEnd/                    # NestJS Backend (Port 3000)
│   │   ├── src/
│   │   │   ├── features/           # Vertical slice modules
│   │   │   │   ├── business-management/
│   │   │   │   │   ├── api/        # Controllers + DTOs
│   │   │   │   │   ├── domain/     # Services
│   │   │   │   │   └── data/       # Repository
│   │   │   │   ├── map-scraping/
│   │   │   │   ├── lead-enrichment/
│   │   │   │   ├── outreach-campaigns/
│   │   │   │   ├── job-queue/
│   │   │   │   └── analytics/      # Dashboard analytics
│   │   │   ├── prisma/             # Database client
│   │   │   ├── websocket/          # Socket.io gateway
│   │   │   ├── config/             # API secrets loader
│   │   │   └── caching/            # Redis cache layer
│   │   └── prisma/
│   │       └── schema.prisma       # 5 models
│   │
│   └── FrontEnd/                   # Next.js 16 Dashboard (Port 3001)
│       ├── app/                    # App Router pages
│       ├── components/
│       │   ├── dashboard/          # Dashboard sections
│       │   ├── ui/                 # ShadCN/UI components
│       │   ├── magicui/            # Magic-UI animations
│       │   └── layout/             # AppShell, Sidebar, Header
│       ├── core/                   # Providers, API client
│       └── features/               # Feature-specific code
│
├── docs/                           # Project Documentation
│   ├── planning/                   # Planning frameworks & implementation guides
│   ├── orchestration/              # Multi-agent coordination
│   └── dashboard/                  # Dashboard build plans
│
├── CLAUDE.md                       # AI development instructions
└── README.md                       # This file
```

## 📖 Documentation

Comprehensive project documentation is organized in the `docs/` directory:

- **[docs/planning/](docs/planning/)** - Planning methodologies, core principles, and implementation guides
  - `GlobalRuleSections.md` - Core architectural principles
  - `PlanningPrompts.md` - "Vibe planning" templates for feature exploration
  - `coding-prompt.md` - Implementation guides for coding agents

- **[docs/orchestration/](docs/orchestration/)** - Multi-agent coordination and parallel execution
  - `ORCHESTRATION_INSTRUCTIONS.md` - How to coordinate agents
  - `AGENT_PHASE1_SPECIFICATIONS.md` - Detailed agent requirements
  - `PHASE1_AGENT_BRIEFS.md` - Parallel execution task briefs

- **[docs/dashboard/](docs/dashboard/)** - Dashboard-specific documentation
  - `DASHBOARD_BUILD_PLAN.md` - Next.js 16 dashboard build plan

- **[CLAUDE.md](CLAUDE.md)** - AI agent development instructions (root level)

For development guidance, start with [docs/README.md](docs/README.md).

---

## 🔧 Configuration

### Scraper Settings
Edit the scraper configuration in the dashboard or via API:
- **Location:** City/region to search
- **Category:** Business type (e.g., "restaurants")
- **Max Results:** Number of businesses to scrape
- **Radius:** Search radius in meters

### Enrichment Settings
Configure Hunter.io API settings:
- **API Key:** Your Hunter.io API key
- **Rate Limits:** Respect API quotas
- **Batch Size:** Number of concurrent enrichments

## 🚀 Deployment

The application can be deployed to any Node.js hosting platform:

1. Build the frontend: `cd App/FrontEnd && npm run build`
2. Build the backend: `cd ../BackEnd && yarn build`
3. Set environment variables for production
4. Start the production server: `yarn start:prod`

### Production Checklist
- ✅ Environment variables configured
- ✅ Database migrations run
- ✅ Dashboard built and exported (in App/FrontEnd/)
- ✅ API documentation accessible
- ✅ WebSocket connection working
- ✅ Telegram bot configured

## 📊 Database Schema

### Core Models (5 total)
```prisma
model business {
  id                 Int                  @id @default(autoincrement())
  name               String
  address            String?
  city               String?
  state              String?              @default("NJ")
  zip                String?
  phone              String?
  website            String?
  business_type      String?
  industry           String?
  employee_count     Int?
  year_founded       Int?
  google_maps_url    String?
  latitude           Float?
  longitude          Float?
  enrichment_status  String               @default("pending") // pending, enriched, failed
  source             String               @default("google_maps")
  created_at         DateTime             @default(now())
  updated_at         DateTime             @updatedAt

  contacts           contact[]
  enrichment_logs    enrichment_log[]
  outreach_messages  outreach_message[]

  @@index([city])
  @@index([industry])
  @@index([enrichment_status])
}

model contact {
  id                 Int                  @id @default(autoincrement())
  business_id        Int
  name               String?
  email              String?
  email_verified     Boolean?             @default(false)
  phone              String?
  is_primary         Boolean              @default(false)
  // ... relations: business, outreach_messages
}

model enrichment_log {
  id                 Int                  @id @default(autoincrement())
  business_id        Int
  service            String               // hunter, abstract
  status             String               // success, failed
  // ... audit fields
}

model outreach_message {
  id                 Int                  @id @default(autoincrement())
  business_id        Int
  contact_id         Int?
  message_text       String               @db.Text
  status             String               @default("generated") // generated, sent, failed
  // ... relations: business, contact
}

model job_history {
  id                 String               @id @default(uuid())
  jobId              String               @unique
  queueName          String
  status             String               // pending, active, completed, failed
  // ... job metadata
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Powered by [Next.js](https://nextjs.org/)
- Database by [PostgreSQL](https://www.postgresql.org/)
- ORM by [Prisma](https://www.prisma.io/)
- Planned, implemented, and validated by Claude Code

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: admin@letip.com

---

**Made with ❤️ by Le Tip of Western Monmouth County**
