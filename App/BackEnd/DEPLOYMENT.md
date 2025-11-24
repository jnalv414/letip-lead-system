# Le Tip Lead System - Deployment Guide

## System Overview

The Le Tip Lead System is a comprehensive lead management platform consisting of:
- **NestJS Backend API** (Port 3000) - Main backend with WebSocket support
- **Next.js Dashboard** (Port 3001) - Web-based management interface
- **PostgreSQL Database** - Prisma ORM for data management
- **WebSocket Server** - Real-time updates
- **Hunter.io Integration** - Lead enrichment
- **Telegram Bot** (Optional) - Mobile notifications

## ✅ Features Implemented

### Backend (NestJS)
- ✅ RESTful API with Swagger documentation
- ✅ WebSocket support for real-time updates
- ✅ Google Maps scraping
- ✅ Lead enrichment with Hunter.io
- ✅ AI-powered outreach message generation
- ✅ Telegram bot integration (optional)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Professional Swagger UI styling

### Frontend (Next.js Dashboard)
- ✅ Real-time dashboard with statistics
- ✅ Business management table with filtering
- ✅ WebSocket integration for live updates
- ✅ Export to CSV functionality
- ✅ Bulk enrichment operations
- ✅ Responsive design
- ✅ Modern UI with Tailwind CSS

## Production Deployment (Abacus.AI)

### Current Setup
- **Production URL**: https://letipofwesternmonmouthcounty.abacusai.app
- **Backend Port**: 3000
- **Dashboard Port**: 3001 (development only)

### Accessing the System

**Production (Deployed)**:
- API: https://letipofwesternmonmouthcounty.abacusai.app
- API Docs: https://letipofwesternmonmouthcounty.abacusai.app/api-docs

**Development (Local)**:
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- Dashboard: http://localhost:3001

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Hunter.io API key

### Starting the Backend

```bash
cd /home/ubuntu/letip_lead_system/nodejs_space
npm install
npm run start:dev
```

### Starting the Dashboard

```bash
cd /home/ubuntu/letip_lead_system/dashboard
npm install
NEXT_PUBLIC_API_URL=http://localhost:3000 npx next dev -p 3001
```

## WebSocket Events

The system emits the following real-time events:

### Events Emitted by Server
- `business:created` - New business added
- `business:enriched` - Business enrichment completed
- `stats:updated` - Dashboard statistics updated
- `scraping:progress` - Scraping progress updates
- `enrichment:progress` - Enrichment progress updates

### Client Subscription Example
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('business:created', (business) => {
  console.log('New business:', business);
});

socket.on('stats:updated', (stats) => {
  console.log('Stats updated:', stats);
});
```

## API Endpoints

### Businesses
- `GET /api/businesses` - List all businesses
- `GET /api/businesses/stats` - Get statistics
- `GET /api/businesses/:id` - Get single business
- `POST /api/businesses` - Create business
- `DELETE /api/businesses/:id` - Delete business

### Scraping
- `POST /api/scrape` - Scrape Google Maps

### Enrichment
- `POST /api/enrich/:id` - Enrich single business
- `POST /api/enrich/batch/process` - Bulk enrich

### Outreach
- `POST /api/outreach/:businessId` - Generate outreach message
- `GET /api/outreach` - List outreach messages

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
PORT=3000
```

### Dashboard (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Testing WebSocket Connection

```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

## Troubleshooting

### WebSocket Connection Issues
- Ensure CORS is enabled in NestJS
- Check that Socket.IO is properly initialized
- Verify firewall rules allow WebSocket connections

### Dashboard Not Updating
- Check browser console for WebSocket errors
- Verify NEXT_PUBLIC_API_URL is set correctly
- Ensure backend is running and accessible

### Database Connection Errors
- Verify DATABASE_URL in .env
- Check PostgreSQL is running
- Run `npx prisma migrate dev` to sync database

## Production Checklist

- [x] WebSocket support implemented
- [x] Real-time dashboard updates
- [x] API documentation configured
- [x] Error handling and logging
- [x] CORS properly configured
- [x] Database migrations ready
- [x] Hunter.io integration working
- [ ] Dashboard deployed to production (currently dev only)
- [ ] SSL/HTTPS configured
- [ ] Environment variables set in production

## Next Steps

1. **Deploy Dashboard**: Integrate Next.js dashboard with NestJS for production
2. **Add Authentication**: Implement user authentication for dashboard
3. **Add More Pages**: Map view, enrichment manager, outreach center
4. **Monitoring**: Set up application monitoring and alerts
5. **Backup Strategy**: Implement automated database backups

## Support

For issues or questions:
- Check logs at `/tmp/backend.log` and `/tmp/dashboard.log`
- Review API documentation at `/api-docs`
- Check database connection with `npx prisma studio`
