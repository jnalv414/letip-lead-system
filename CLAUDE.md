# Le Tip Lead System Development Instructions

## Cross-References

- **Backend Documentation**: [App/BackEnd/CLAUDE.md](App/BackEnd/CLAUDE.md)
- **Frontend Documentation**: [App/FrontEnd/CLAUDE.md](App/FrontEnd/CLAUDE.md)

## Project Overview

Automated business lead generation, enrichment, and outreach platform for Le Tip of Western Monmouth County, New Jersey. Built with NestJS backend + Next.js 16 dashboard, PostgreSQL/Prisma, Socket.io WebSockets, Apify scraping, and external API integrations (Hunter.io, AbstractAPI).

**Local Development:** http://localhost:3000

**Architecture:**
```
letip-lead-system/
├── App/
│   ├── BackEnd/         # NestJS backend (Port 3000)
│   │   ├── src/
│   │   │   ├── businesses/  # CRUD + WebSocket events
│   │   │   ├── scraper/     # Google Maps scraping (Puppeteer)
│   │   │   ├── enrichment/  # Hunter.io + AbstractAPI
│   │   │   ├── outreach/    # AI message generation
│   │   │   ├── websocket/   # Socket.io gateway
│   │   │   └── prisma/      # Database client
│   │   └── prisma/
│   │       └── schema.prisma # 4 models: business, contact, enrichment_log, outreach_message
│   │
│   └── FrontEnd/        # Next.js 16 frontend (in development)
│       └── (ShadCN + Magic-UI + Framer Motion + Socket.io client)
```

## Core Principles

1. **MODULE ISOLATION IS CRITICAL**
   - Each NestJS module is self-contained with its own controller, service, module file, and DTOs
   - Services are injected via dependency injection - never import instances directly
   - Database access goes through PrismaService only

2. **REAL-TIME FIRST**
   - All mutations emit WebSocket events via WebsocketGateway
   - Frontend consumes real-time updates for live dashboard experience
   - Never assume synchronous state - always listen for events

3. **EXTERNAL API RESILIENCE**
   - All external calls (Hunter.io, AbstractAPI) must handle failures gracefully
   - Use template-based message generation for outreach
   - Log all enrichment attempts to `enrichment_log` table for debugging
   - Respect rate limits: Hunter.io (500/month), AbstractAPI (3,000/month)

4. **API SECRETS ARE FILE-BASED, NOT ENV-BASED**
   - Secrets stored in `~/.config/letip_api_secrets.json` (not `.env`)
   - ConfigService loads this file on startup
   - Never hardcode API keys or commit them to git

5. **DATABASE RELATIONSHIPS MATTER**
   - All foreign keys use `onDelete: Cascade` - deleting a business removes all related data
   - Enrichment status tracked on business: `pending`, `enriched`, `failed`
   - Always update business.updated_at on enrichment completion

---

## Architecture Overview

### Backend Architecture (NestJS)

**Core Modules:**
- **Businesses Module**: CRUD operations, primary entity management
- **Scraper Module**: Google Maps scraping via Puppeteer
- **Enrichment Module**: Contact discovery (Hunter.io) + firmographic data (AbstractAPI)
- **Outreach Module**: AI-powered message generation with fallback templates
- **WebSocket Module**: Real-time event broadcasting to frontend
- **Prisma Module**: Database abstraction layer

**Data Flow:**
1. Scraper discovers businesses → saves to database → emits WebSocket event
2. Enrichment service queries external APIs → updates business record → emits event
3. Outreach service generates messages → stores results → emits event
4. Frontend listens to all events → updates UI in real-time

**Database Schema:**
```
business (primary)
├── contacts[] (one-to-many, cascade delete)
├── enrichment_logs[] (audit trail, cascade delete)
└── outreach_messages[] (generated content, cascade delete)
```

### Frontend Architecture (Next.js 16)

**Technology Stack:**
- Next.js 16 App Router with Turbopack (stable)
- React 19.2 with View Transitions
- ShadCN/UI + Magic-UI components
- Socket.io client for real-time updates
- Zustand + SWR for state management
- Framer Motion for animations

**Key Features:**
- Real-time dashboard with live business updates
- WebSocket-driven UI state synchronization
- Dark mode support (Tailwind CSS)
- Responsive design for mobile/desktop

See [App/FrontEnd/CLAUDE.md](App/FrontEnd/CLAUDE.md) for detailed frontend documentation.

### External Integrations

**Apify (Scraping):**
- Actor: `apify/google-maps-scraper`
- Discovers businesses from Google Maps
- Returns: name, address, phone, website, coordinates

**Hunter.io (Email Discovery):**
- Rate limit: 500 requests/month
- Domain-based email discovery and verification
- Requires valid website URL

**AbstractAPI (Firmographics):**
- Rate limit: 3,000 requests/month
- Company data: industry, employee count, year founded
- Domain-based lookup

**Message Generation:**
- Template-based outreach message creation
- Personalization using business data (name, city, industry)

---

## Security Checklist

**Current state: NO AUTHENTICATION IMPLEMENTED**

Before deploying to production with sensitive data:

- [ ] Add JWT authentication to API endpoints
- [ ] Restrict WebSocket CORS (currently allows all origins)
- [ ] Move API keys to encrypted secret management (not filesystem)
- [ ] Implement rate limiting on public endpoints
- [ ] Add API key authentication for external access
- [ ] Enable HTTPS/SSL
- [ ] Add request validation and sanitization

**Current vulnerabilities:**
- All API endpoints publicly accessible
- WebSocket accepts connections from any origin
- API keys stored in plaintext file
- No rate limiting on scraping/enrichment
- No audit logging for sensitive operations

---

## Key Files Reference

**Configuration:**
- `App/BackEnd/src/config/config.service.ts` - API key loading
- `App/BackEnd/prisma/schema.prisma` - Complete database schema
- `App/BackEnd/src/app.module.ts` - Static file serving setup

**Core Services:**
- `App/BackEnd/src/scraper/scraper.service.ts` - Puppeteer scraping (DOM selectors)
- `App/BackEnd/src/enrichment/enrichment.service.ts` - Hunter.io + AbstractAPI integration
- `App/BackEnd/src/outreach/outreach.service.ts` - AI fallback template logic
- `App/BackEnd/src/businesses/businesses.service.ts` - WebSocket event emission

**WebSocket:**
- `App/BackEnd/src/websocket/websocket.gateway.ts` - Socket.io gateway configuration
- `App/BackEnd/src/businesses/businesses.service.ts` - Event emission pattern

**Testing:**
- `App/BackEnd/test/app.e2e-spec.ts` - E2E test skeleton

**Frontend:**
- `App/FrontEnd/` - Next.js 16 application (see App/FrontEnd/CLAUDE.md)

---

## AI Agent Development Notes

When debugging this codebase:

**Backend issues:**
- Check NestJS logs for service-level errors
- Query `enrichment_log` table for external API failures
- Use Prisma Studio to inspect database state: `cd App/BackEnd && yarn prisma studio`
- Test WebSocket with wscat: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

**Frontend issues:**
- Check browser console for WebSocket connection errors
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Test API directly with curl before implementing in frontend
- Use React DevTools to inspect Zustand state

**Database issues:**
- Use `cd App/BackEnd && yarn prisma studio` for visual inspection
- Check migration status: `cd App/BackEnd && yarn prisma migrate status`
- Reset database (dev only): `cd App/BackEnd && yarn prisma migrate reset`

**External API issues:**
- Review `enrichment_log` table for error messages
- Check rate limits: Hunter.io (500/month), AbstractAPI (3,000/month)
- Verify secrets file: `cat ~/.config/letip_api_secrets.json`
- Test APIs directly with curl to isolate issues

**Common pitfalls:**
- Forgetting to emit WebSocket events after mutations
- Not handling enrichment failures gracefully (no fallback)
- Apify actor runs not monitored for completion
- Missing `await` on async Prisma calls
- Cascade deletes removing more data than expected
- Apify quota exhausted without proper error handling

---

## Development Workflow Quick Reference

**Backend (see App/BackEnd/CLAUDE.md for details):**
```bash
cd App/BackEnd
yarn start:dev          # Hot-reload development server
yarn prisma studio      # Database GUI
yarn test              # Run all tests
```

**Frontend (see App/FrontEnd/CLAUDE.md for details):**
```bash
cd App/FrontEnd
npm run dev            # Development server (port 3001)
npm run build          # Production build
```

**Full Documentation:**
- Backend: [App/BackEnd/CLAUDE.md](App/BackEnd/CLAUDE.md)
- Frontend: [App/FrontEnd/CLAUDE.md](App/FrontEnd/CLAUDE.md)
