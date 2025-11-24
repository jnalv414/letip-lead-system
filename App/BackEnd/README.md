# 🎯 Le Tip Lead System

> A comprehensive business lead scraping, enrichment, and outreach management system for **Le Tip of Western Monmouth County**, New Jersey.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Telegram Bot Integration](#telegram-bot-integration)
- [REST API Documentation](#rest-api-documentation)
- [Database Schema](#database-schema)
- [Enrichment Services](#enrichment-services)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)
- [Tech Stack](#tech-stack)

---

## 🌟 Overview

The **Le Tip Lead System** is an automated business lead management platform designed to help the Le Tip of Western Monmouth County networking group discover, enrich, and reach out to local business owners.

### What It Does

1. **🔍 Scrapes** local businesses from Google Maps along Route 9 (Freehold, Marlboro, Manalapan, Howell)
2. **💎 Enriches** business data with contact information and firmographics using Hunter.io and AbstractAPI
3. **✉️ Generates** personalized AI-powered outreach messages for recruiting new members
4. **🤖 Provides** a Telegram bot interface for easy management and interaction
5. **📊 Tracks** all activities with comprehensive statistics and reporting

### Target Audience

- Small to medium-sized **local businesses** (not chains or franchises)
- Business owners or representatives in Western Monmouth County, NJ
- Businesses within a 1-mile radius of Route 9

---

## ✨ Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Google Maps Scraper** | Automatically scrapes business information from Google Maps based on location and radius |
| **Lead Enrichment** | Enriches business data with firmographics (AbstractAPI) and contact information (Hunter.io) |
| **AI Outreach Generator** | Creates personalized outreach messages using AI to recruit new Le Tip members |
| **Telegram Bot** | Full-featured bot for managing leads, triggering actions, and viewing statistics |
| **REST API** | Complete REST API with Swagger documentation for programmatic access |
| **PostgreSQL Database** | Robust data storage with proper relationships and indexing |
| **Batch Processing** | Efficiently process multiple leads at once with rate limiting |
| **CSV Export** | Export leads to CSV format via Telegram or API |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Bot Interface                   │
│                   (User Interaction Layer)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      NestJS REST API                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Scraper    │  │  Enrichment  │  │  Outreach Gen    │  │
│  │  Module     │  │  Module      │  │  Module          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Businesses  │  │  Telegram    │  │  Config          │  │
│  │ Module      │  │  Module      │  │  Module          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                PostgreSQL Database (Prisma)                  │
│  • businesses  • contacts  • enrichment_logs                 │
│  • outreach_messages                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    External Services                         │
│  • Google Maps (Scraping)                                    │
│  • Hunter.io (Email Finding & Verification)                  │
│  • AbstractAPI (Firmographic Data)                           │
│  • Abacus.AI LLM APIs (Outreach Generation)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **Yarn**
- **PostgreSQL** database
- **API Keys** for:
  - Hunter.io (email enrichment)
  - AbstractAPI (firmographic enrichment)
  - Telegram Bot Token
  - Abacus.AI API key (for LLM)

### Installation

1. **Install dependencies:**
   ```bash
   cd /home/ubuntu/letip_lead_system/nodejs_space
   yarn install
   ```

2. **Configure API secrets:**
   
   Your API secrets are stored in `/home/ubuntu/.config/abacusai_auth_secrets.json`:
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

3. **Set up the database:**
   ```bash
   yarn prisma generate
   yarn prisma db push
   ```

4. **Start the server:**
   ```bash
   # Development mode (with hot-reload)
   yarn start:dev

   # Production mode
   yarn build
   yarn start:prod
   ```

5. **Access the application:**
   - **API Server:** `http://localhost:3000`
   - **API Documentation:** `http://localhost:3000/api-docs`
   - **Telegram Bot:** Search for your bot on Telegram and start chatting!

---

## 🤖 Telegram Bot Integration

### Overview

The Telegram bot provides a **conversational interface** to interact with the lead management system. It's the primary way users will manage leads, trigger scraping, and generate outreach messages.

### Setting Up Your Bot

1. **Create a bot with BotFather:**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the prompts
   - Choose a name: `Le Tip Lead Manager`
   - Choose a username: `letip_lead_bot` (must end in 'bot')
   - Copy the bot token provided

2. **Configure the token:**
   - The token is already configured in your secrets file
   - The bot will automatically start when the server starts

3. **Start using your bot:**
   - Search for your bot in Telegram
   - Send `/start` to begin

---

### 📱 Bot Commands Reference

#### `/start` or `/help`
**Purpose:** Display welcome message and command list

**Example:**
```
User: /start
Bot: 🎯 Le Tip Lead System
     Welcome to the Le Tip of Western Monmouth business lead management system!
     
     Available Commands:
     📊 /stats - View system statistics
     🔍 /scrape [location] - Scrape businesses from Google Maps
     ...
```

---

#### `/stats`
**Purpose:** View comprehensive system statistics

**Example:**
```
User: /stats
Bot: 📊 Lead System Statistics

     Overall:
     • Total Businesses: 247
     • Enriched: 189 (77%)
     • Pending: 45
     • Failed: 13

     Top Cities:
     1. Freehold: 98
     2. Marlboro: 72
     3. Manalapan: 45
     4. Howell: 32

     Top Industries:
     1. Professional Services: 67
     2. Retail: 43
     3. Healthcare: 38
     4. Construction: 29
     5. Food Services: 21
```

**What It Shows:**
- Total businesses in database
- Enrichment status breakdown (enriched, pending, failed)
- Top 5 cities by business count
- Top 5 industries by business count

---

#### `/scrape [location]`
**Purpose:** Scrape businesses from Google Maps

**Parameters:**
- `location` - Location to search (e.g., "Route 9, Freehold, NJ")

**Examples:**
```
User: /scrape Route 9, Freehold, NJ
Bot: 🔍 Starting to scrape businesses near: Route 9, Freehold, NJ
     This may take a few minutes...
     
     [After completion]
     ✅ Scraping Complete!
     • Found: 87 businesses
     • Saved: 45 new businesses
     • Skipped: 42 duplicates
```

```
User: /scrape Marlboro Township, NJ
User: /scrape Manalapan, Monmouth County
User: /scrape Route 9 and Route 33, Howell
```

**How It Works:**
1. Searches Google Maps for businesses in the specified location
2. Extracts business name, address, phone, website, Google Maps URL
3. Saves new businesses to database with `pending` enrichment status
4. Skips duplicates (based on name + address)
5. Returns summary of results

**Note:** Scraping typically finds 50-100 businesses per location depending on density.

---

#### `/leads [filters]`
**Purpose:** List recent leads with optional filtering

**Parameters:**
- `filters` (optional) - Filter format: `key:value`
  - `city:CityName` - Filter by city
  - `status:pending|enriched|failed` - Filter by enrichment status

**Examples:**
```
User: /leads
Bot: 📋 Recent Leads (Page 1/5)

     1. ABC Plumbing Services (ID: 123)
        📍 Freehold, NJ
        🏢 Professional Services
        ✅ Status: enriched
        👥 Contacts: 2

     2. XYZ Auto Repair (ID: 124)
        📍 Marlboro, NJ
        🏢 Automotive
        ✅ Status: pending
        👥 Contacts: 0
     ...
     
     Total: 247 businesses
```

```
User: /leads city:Freehold
Bot: [Shows only Freehold businesses]

User: /leads status:pending
Bot: [Shows only businesses pending enrichment]

User: /leads status:enriched
Bot: [Shows only enriched businesses]
```

**Display Format:**
- Shows 10 businesses per page
- Displays business name, ID, location, industry, enrichment status, contact count
- Total count at bottom

---

#### `/enrich [id]`
**Purpose:** Enrich a specific business with contact and firmographic data

**Parameters:**
- `id` - Business ID from `/leads` command

**Example:**
```
User: /enrich 123
Bot: 💎 Enriching business ID: 123...

     ✅ Enrichment Complete

     Business: ABC Plumbing Services (ID: 123)

     ✓ AbstractAPI: Success
     ✓ Hunter.io: Success
```

**What It Does:**
1. **AbstractAPI Enrichment:**
   - Fetches firmographic data (industry, employee count, year founded, business type)
   - Updates business record with enriched data

2. **Hunter.io Enrichment:**
   - Searches for email addresses associated with the business domain
   - Verifies email addresses
   - Finds contact names and titles
   - Creates contact records in database

**Possible Outcomes:**
- ✅ Both services succeed - Full enrichment
- ⚠️ Partial success - One service fails (shows errors)
- ❌ Complete failure - Both services fail

---

#### `/enrich_batch [count]`
**Purpose:** Enrich multiple pending businesses at once

**Parameters:**
- `count` (optional) - Number of businesses to enrich (default: 10, max: 50)

**Examples:**
```
User: /enrich_batch
Bot: ⚡ Starting batch enrichment for 10 businesses...
     This may take several minutes.

     [After completion]
     ✅ Batch Enrichment Complete

     • Total Processed: 10
     • Successfully Enriched: 8
     • Failed: 2

     Use /leads status:enriched to view enriched businesses.
```

```
User: /enrich_batch 25
Bot: [Enriches 25 businesses]

User: /enrich_batch 50
Bot: [Enriches 50 businesses - maximum allowed]
```

**How It Works:**
1. Fetches pending businesses from database (ordered by creation date)
2. Processes each business sequentially
3. For each business:
   - Attempts AbstractAPI enrichment
   - Attempts Hunter.io enrichment
   - Updates enrichment status
   - Logs results
4. Returns summary of successful vs failed enrichments

**Processing Time:**
- Approximately 5-10 seconds per business
- 10 businesses: ~1-2 minutes
- 25 businesses: ~3-5 minutes
- 50 businesses: ~5-10 minutes

**Rate Limits:**
- Hunter.io: 500 searches/month
- AbstractAPI: 3,000 requests/month
- Bot automatically respects these limits

---

#### `/outreach [id]`
**Purpose:** Generate personalized AI outreach message for a business

**Parameters:**
- `id` - Business ID from `/leads` command

**Example:**
```
User: /outreach 123
Bot: ✉️ Generating outreach message for business ID: 123...

     ✅ Outreach Message Generated

     Business ID: 123

     ---
     Subject: Exclusive Business Networking Opportunity in Freehold

     Dear John Smith,

     I hope this message finds you well. My name is [Your Name], and I'm 
     reaching out on behalf of Le Tip of Western Monmouth County, a premier 
     business networking organization serving the local business community 
     in Freehold and surrounding areas.

     I came across ABC Plumbing Services and was impressed by your commitment 
     to serving the Freehold community. As a professional services provider, 
     you would be an excellent fit for our organization.

     Le Tip of Western Monmouth offers:
     • Exclusive networking with one business per category
     • Qualified referrals from trusted local business owners
     • Weekly meetings to build relationships and exchange leads
     • A supportive community focused on mutual growth

     I'd love to invite you to attend one of our meetings as a guest to 
     experience the value firsthand. Would you be available for a brief 
     call this week to discuss how Le Tip can benefit your business?

     Looking forward to connecting with you.

     Best regards,
     [Your Name]
     Le Tip of Western Monmouth County
     ---

     Status: generated
     Generated: 1/21/2025, 3:45:22 PM
```

**What It Does:**
1. Fetches business details and contact information
2. Sends data to Abacus.AI LLM with context about Le Tip
3. Generates personalized message based on:
   - Business name
   - Industry
   - Business type
   - Owner/contact name (if available)
   - Location
4. Stores message in database for future reference
5. Returns formatted message ready to copy and send

**Personalization Elements:**
- Mentions specific business name
- References their industry/business type
- Highlights relevant Le Tip benefits for their industry
- Professional yet friendly tone
- Clear call-to-action

**Note:** Messages are stored in the database so you can retrieve them later via `/outreach [id]` again or through the API.

---

#### `/export`
**Purpose:** Export all leads to CSV file

**Example:**
```
User: /export
Bot: 📤 Preparing export...

     [Sends CSV file]
     📊 Exported 247 businesses
```

**CSV Format:**
- Headers: ID, Name, Address, City, State, ZIP, Phone, Website, Industry, Business Type, Employee Count, Year Founded, Enrichment Status, Contacts Count
- One row per business
- Includes all businesses (up to 1,000)

**File Name Format:**
- `letip_leads_YYYY-MM-DD.csv`
- Example: `letip_leads_2025-01-21.csv`

**Use Cases:**
- Import into CRM systems
- Share with team members
- Backup data
- Analyze in Excel/Google Sheets

---

### 🎨 Bot Response Formatting

The bot uses **Markdown formatting** for clear, organized responses:

- **Bold text**: Important information (business names, section headers)
- `Code blocks`: Commands and examples
- Emojis: Visual indicators (🔍 scraping, 💎 enrichment, ✅ success, ❌ error)
- Line breaks: Organized sections for readability
- Numbered/bulleted lists: Statistics and multiple items

---

### 🔒 Security Considerations

**Bot Access Control:**
- Currently, anyone who knows your bot's username can interact with it
- For production, consider implementing:
  - User authentication (whitelist of allowed Telegram user IDs)
  - Admin-only commands
  - Rate limiting per user

**Sensitive Data:**
- Bot messages may contain business contact information
- Ensure conversations are only accessible to authorized users
- Consider end-to-end encryption for sensitive operations

---

### 🐛 Bot Troubleshooting

**Bot not responding:**
1. Check if server is running: `yarn start:dev`
2. Verify bot token is correctly configured in secrets file
3. Check server logs for errors
4. Ensure bot polling is working (check logs for "Telegram bot started successfully")

**Bot commands not working:**
1. Make sure you're using the exact command format with `/` prefix
2. Check for typos in command parameters
3. Verify the business ID exists when using `/enrich` or `/outreach`

**Enrichment failing:**
1. Verify API keys are correct in secrets file
2. Check rate limits for Hunter.io (500/month) and AbstractAPI (3,000/month)
3. Review enrichment logs in database for specific errors

---

## 🌐 REST API Documentation

### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com`

### Interactive Documentation
- **Swagger UI:** `http://localhost:3000/api-docs`

### Authentication
Currently, the API does not require authentication. For production, implement API keys or JWT tokens.

---

### API Endpoints

#### **Businesses**

##### `GET /api/businesses`
List all businesses with pagination and filtering

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 20 |
| `city` | string | Filter by city | - |
| `state` | string | Filter by state | - |
| `industry` | string | Filter by industry | - |
| `enrichment_status` | string | Filter by status (pending/enriched/failed) | - |

**Example Request:**
```bash
curl "http://localhost:3000/api/businesses?page=1&limit=20&city=Freehold&enrichment_status=enriched"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 123,
      "name": "ABC Plumbing Services",
      "address": "123 Main St",
      "city": "Freehold",
      "state": "NJ",
      "zip": "07728",
      "phone": "(732) 555-1234",
      "website": "https://abcplumbing.com",
      "business_type": "Service Provider",
      "industry": "Professional Services",
      "employee_count": 15,
      "year_founded": 2010,
      "enrichment_status": "enriched",
      "google_maps_url": "https://maps.google.com/?cid=123456789",
      "latitude": 40.2606,
      "longitude": -74.2738,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T15:45:00Z",
      "contacts": [
        {
          "id": 456,
          "name": "John Smith",
          "title": "Owner",
          "email": "john@abcplumbing.com",
          "email_verified": true,
          "phone": "(732) 555-1234",
          "is_primary": true
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 247,
    "totalPages": 13
  }
}
```

---

##### `GET /api/businesses/:id`
Get single business with all related data

**Example Request:**
```bash
curl "http://localhost:3000/api/businesses/123"
```

**Example Response:**
```json
{
  "id": 123,
  "name": "ABC Plumbing Services",
  "address": "123 Main St",
  "city": "Freehold",
  "state": "NJ",
  "zip": "07728",
  "phone": "(732) 555-1234",
  "website": "https://abcplumbing.com",
  "business_type": "Service Provider",
  "industry": "Professional Services",
  "employee_count": 15,
  "year_founded": 2010,
  "enrichment_status": "enriched",
  "google_maps_url": "https://maps.google.com/?cid=123456789",
  "latitude": 40.2606,
  "longitude": -74.2738,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-20T15:45:00Z",
  "contacts": [
    {
      "id": 456,
      "name": "John Smith",
      "title": "Owner",
      "email": "john@abcplumbing.com",
      "email_verified": true,
      "phone": "(732) 555-1234",
      "linkedin_url": "https://linkedin.com/in/johnsmith",
      "is_primary": true,
      "created_at": "2025-01-20T15:45:00Z"
    }
  ],
  "enrichment_logs": [
    {
      "id": 789,
      "service": "hunter",
      "status": "success",
      "created_at": "2025-01-20T15:45:00Z"
    },
    {
      "id": 790,
      "service": "abstract",
      "status": "success",
      "created_at": "2025-01-20T15:45:30Z"
    }
  ],
  "outreach_messages": [
    {
      "id": 101,
      "message_text": "Subject: Exclusive Business Networking...",
      "status": "generated",
      "generated_at": "2025-01-21T09:15:00Z"
    }
  ]
}
```

---

##### `GET /api/businesses/stats`
Get comprehensive statistics

**Example Request:**
```bash
curl "http://localhost:3000/api/businesses/stats"
```

**Example Response:**
```json
{
  "total": 247,
  "enriched": 189,
  "pending": 45,
  "failed": 13,
  "byCity": [
    { "city": "Freehold", "count": 98 },
    { "city": "Marlboro", "count": 72 },
    { "city": "Manalapan", "count": 45 },
    { "city": "Howell", "count": 32 }
  ],
  "byIndustry": [
    { "industry": "Professional Services", "count": 67 },
    { "industry": "Retail", "count": 43 },
    { "industry": "Healthcare", "count": 38 },
    { "industry": "Construction", "count": 29 },
    { "industry": "Food Services", "count": 21 }
  ]
}
```

---

##### `DELETE /api/businesses/:id`
Delete a business and all related data

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/businesses/123"
```

**Example Response:**
```json
{
  "message": "Business deleted successfully",
  "id": 123
}
```

---

#### **Scraper**

##### `POST /api/scrape`
Scrape businesses from Google Maps

**Request Body:**
```json
{
  "location": "Route 9, Freehold, NJ",
  "radius": 1,
  "max_results": 50
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Route 9, Freehold, NJ",
    "radius": 1,
    "max_results": 50
  }'
```

**Example Response:**
```json
{
  "found": 87,
  "saved": 45,
  "skipped": 42,
  "errors": []
}
```

---

#### **Enrichment**

##### `POST /api/enrich/:id`
Enrich a specific business

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/enrich/123"
```

**Example Response:**
```json
{
  "businessId": 123,
  "businessName": "ABC Plumbing Services",
  "abstract": true,
  "hunter": true,
  "errors": []
}
```

---

##### `POST /api/enrich/batch/process`
Batch enrich multiple businesses

**Request Body:**
```json
{
  "limit": 25
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/enrich/batch/process" \
  -H "Content-Type: application/json" \
  -d '{"limit": 25}'
```

**Example Response:**
```json
{
  "total": 25,
  "enriched": 22,
  "failed": 3
}
```

---

#### **Outreach**

##### `POST /api/outreach/:id`
Generate outreach message for a business

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/outreach/123"
```

**Example Response:**
```json
{
  "id": 101,
  "business_id": 123,
  "contact_id": 456,
  "message_text": "Subject: Exclusive Business Networking Opportunity...",
  "status": "generated",
  "generated_at": "2025-01-21T09:15:00Z",
  "sent_at": null
}
```

---

##### `GET /api/outreach/:id`
Get outreach messages for a business

**Example Request:**
```bash
curl "http://localhost:3000/api/outreach/123"
```

**Example Response:**
```json
[
  {
    "id": 101,
    "business_id": 123,
    "contact_id": 456,
    "message_text": "Subject: Exclusive Business Networking Opportunity...",
    "status": "generated",
    "generated_at": "2025-01-21T09:15:00Z",
    "sent_at": null
  }
]
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────┐
│             business                     │
├─────────────────────────────────────────┤
│ id (PK)                                  │
│ name                                     │
│ address, city, state, zip                │
│ phone, website                           │
│ business_type, industry                  │
│ employee_count, year_founded             │
│ google_maps_url                          │
│ latitude, longitude                      │
│ enrichment_status                        │
│ source                                   │
│ created_at, updated_at                   │
└──────────────┬──────────────────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────────────────┐
│             contact                      │
├─────────────────────────────────────────┤
│ id (PK)                                  │
│ business_id (FK)                         │
│ name, title                              │
│ email, email_verified                    │
│ phone, linkedin_url                      │
│ is_primary                               │
│ created_at, updated_at                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┼──────────────────────────┐
│              │                           │
│ 1:N          │ 1:N                       │
│              │                           │
┌──────────────▼───────┐  ┌───────────────▼──────────┐
│  enrichment_log      │  │   outreach_message       │
├──────────────────────┤  ├──────────────────────────┤
│ id (PK)              │  │ id (PK)                  │
│ business_id (FK)     │  │ business_id (FK)         │
│ service              │  │ contact_id (FK)          │
│ status               │  │ message_text             │
│ request_data         │  │ status                   │
│ response_data        │  │ generated_at, sent_at    │
│ error_message        │  │ created_at, updated_at   │
│ created_at           │  └──────────────────────────┘
└──────────────────────┘
```

### Table Descriptions

#### `business`
Stores core business information

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique business identifier |
| `name` | String | Business name |
| `address` | String | Street address |
| `city` | String | City name |
| `state` | String | State (default: "NJ") |
| `zip` | String | ZIP code |
| `phone` | String | Business phone number |
| `website` | String | Business website URL |
| `business_type` | String | Type of business (e.g., "Service Provider") |
| `industry` | String | Industry category |
| `employee_count` | Integer | Number of employees |
| `year_founded` | Integer | Year business was founded |
| `google_maps_url` | String | Google Maps listing URL |
| `latitude` | Float | Latitude coordinate |
| `longitude` | Float | Longitude coordinate |
| `enrichment_status` | Enum | Status: `pending`, `enriched`, `failed` |
| `source` | String | Data source (e.g., "google_maps") |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

---

#### `contact`
Stores contact information for business decision-makers

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique contact identifier |
| `business_id` | Integer (FK) | Reference to business |
| `name` | String | Contact full name |
| `title` | String | Job title (e.g., "Owner", "CEO") |
| `email` | String | Email address |
| `email_verified` | Boolean | Whether email has been verified |
| `phone` | String | Direct phone number |
| `linkedin_url` | String | LinkedIn profile URL |
| `is_primary` | Boolean | Whether this is the primary contact |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

---

#### `enrichment_log`
Tracks all enrichment attempts for auditing and debugging

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique log identifier |
| `business_id` | Integer (FK) | Reference to business |
| `service` | Enum | Service used: `hunter`, `abstract` |
| `status` | Enum | Result: `success`, `failed` |
| `request_data` | JSON | Request payload sent to service |
| `response_data` | JSON | Response received from service |
| `error_message` | String | Error message if failed |
| `created_at` | DateTime | Log creation timestamp |

---

#### `outreach_message`
Stores AI-generated outreach messages

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Unique message identifier |
| `business_id` | Integer (FK) | Reference to business |
| `contact_id` | Integer (FK) | Reference to contact (optional) |
| `message_text` | Text | Generated outreach message |
| `status` | Enum | Status: `generated`, `sent`, `replied` |
| `generated_at` | DateTime | When message was generated |
| `sent_at` | DateTime | When message was sent (null if not sent) |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

---

## 🔌 Enrichment Services

### Hunter.io

**Purpose:** Find and verify email addresses

**API Endpoints Used:**
- Domain Search - Find emails associated with a domain
- Email Verification - Verify email deliverability

**Data Retrieved:**
- Email addresses
- Contact names
- Job titles
- Email verification status (deliverable, risky, invalid)

**Rate Limits:**
- **Searches:** 500/month
- **Verifications:** 1,000/month

**Cost:**
- **Starter Plan:** $49/month

**Example Enrichment:**
```
Input: abcplumbing.com
Output:
  - john@abcplumbing.com (Owner) - Verified
  - info@abcplumbing.com (General) - Verified
```

---

### AbstractAPI

**Purpose:** Enrich with firmographic data

**API Endpoint Used:**
- Company Enrichment API

**Data Retrieved:**
- Industry classification
- Employee count
- Year founded
- Business type
- Company description

**Rate Limits:**
- **Requests:** 3,000/month

**Cost:**
- **Starter Plan:** $9/month

**Example Enrichment:**
```
Input: abcplumbing.com
Output:
  - Industry: Professional Services
  - Employees: 15
  - Founded: 2010
  - Type: Service Provider
```

---

### Abacus.AI LLM APIs

**Purpose:** Generate personalized outreach messages

**Model:** GPT-4 or similar

**Input Context:**
- Business name
- Industry
- Business type
- Owner/contact name
- Location
- Le Tip organization description

**Output:**
- Professional, personalized email draft
- Subject line
- Clear call-to-action
- Benefits tailored to business type

---

## 📝 Usage Examples

### Workflow 1: Scrape and Enrich New Leads

**Via Telegram:**
```
1. /scrape Route 9, Freehold, NJ
   → Scrapes 50+ businesses
   
2. /stats
   → Check how many pending leads you have
   
3. /enrich_batch 20
   → Enrich 20 pending businesses
   
4. /leads status:enriched
   → View newly enriched leads
   
5. /outreach 123
   → Generate outreach for specific business
```

**Via API:**
```bash
# 1. Scrape businesses
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"location": "Route 9, Freehold, NJ", "radius": 1, "max_results": 50}'

# 2. Get pending businesses
curl "http://localhost:3000/api/businesses?enrichment_status=pending&limit=20"

# 3. Batch enrich
curl -X POST http://localhost:3000/api/enrich/batch/process \
  -H "Content-Type: application/json" \
  -d '{"limit": 20}'

# 4. Get enriched businesses
curl "http://localhost:3000/api/businesses?enrichment_status=enriched&limit=20"

# 5. Generate outreach for specific business
curl -X POST http://localhost:3000/api/outreach/123
```

---

### Workflow 2: Export Leads for CRM Import

**Via Telegram:**
```
1. /export
   → Receive CSV file with all leads
   
2. Import CSV into your CRM system
```

**Via API:**
```bash
# Get all enriched businesses
curl "http://localhost:3000/api/businesses?enrichment_status=enriched&limit=1000" \
  | jq -r '(["ID","Name","Email","Phone","Industry","City"] | @csv), (.data[] | [.id, .name, .contacts[0].email, .phone, .industry, .city] | @csv)'
```

---

### Workflow 3: Monitor Enrichment Progress

**Via Telegram:**
```
1. /stats
   → View overall progress
   
2. /leads status:failed
   → Check failed enrichments
   
3. /enrich 123
   → Retry specific failed enrichment
```

---

## 🔧 Troubleshooting

### Common Issues

#### **Issue: Google Maps scraping returns 0 results**

**Possible Causes:**
- Location is too specific or doesn't exist
- Rate limiting by Google
- Network connectivity issues

**Solutions:**
- Use broader location terms (e.g., "Freehold, NJ" instead of specific addresses)
- Wait 5-10 minutes between scraping attempts
- Check server logs for specific errors

---

#### **Issue: Enrichment always fails for certain businesses**

**Possible Causes:**
- Business doesn't have a website
- Website domain not recognized by enrichment services
- API rate limits exceeded
- Invalid API keys

**Solutions:**
- Check if business has a valid website in database
- Verify API keys in secrets file
- Check monthly rate limit usage
- Review enrichment logs: `SELECT * FROM enrichment_log WHERE business_id = X`

---

#### **Issue: Telegram bot not responding**

**Possible Causes:**
- Server not running
- Invalid bot token
- Telegram API connectivity issues

**Solutions:**
1. Check if server is running: `yarn start:dev`
2. Verify bot token in secrets file
3. Check server logs for "Telegram bot started successfully"
4. Try stopping and restarting the server

---

#### **Issue: Outreach messages are generic**

**Possible Causes:**
- Business data not enriched yet
- Missing contact information
- LLM API issues

**Solutions:**
1. Enrich business first: `/enrich [id]`
2. Verify business has contact information
3. Check Abacus.AI API key configuration

---

### Debugging Tips

**View Server Logs:**
```bash
# Real-time logs
yarn start:dev

# Production logs
pm2 logs letip-lead-system
```

**Query Database Directly:**
```bash
# Enter Prisma Studio
yarn prisma studio

# Or use psql
psql -d your_database_name
SELECT * FROM business WHERE enrichment_status = 'failed';
```

**Test API Endpoints:**
```bash
# Health check
curl http://localhost:3000

# Test specific endpoint
curl http://localhost:3000/api/businesses/stats
```

---

## 💻 Tech Stack

### Backend
- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 18+

### Database
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5.x
- **Migrations:** Prisma Migrate

### External Services
- **Scraping:** Puppeteer / Google Maps API
- **Email Enrichment:** Hunter.io REST API
- **Firmographic Enrichment:** AbstractAPI
- **AI Generation:** Abacus.AI LLM APIs
- **Bot Platform:** Telegram Bot API (node-telegram-bot-api)

### Documentation
- **API Docs:** Swagger / OpenAPI 3.0

### Development Tools
- **Package Manager:** Yarn
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Jest

---

## 📄 License

**Private** - Le Tip of Western Monmouth County

---

## 🤝 Support

For questions or issues:
- Review this README thoroughly
- Check the troubleshooting section
- Review server logs for error details
- Contact the development team

---

## 🎉 Getting Started Checklist

- [ ] Install Node.js 18+ and Yarn
- [ ] Set up PostgreSQL database
- [ ] Configure API secrets (Hunter.io, AbstractAPI, Telegram)
- [ ] Run `yarn install`
- [ ] Run database migrations: `yarn prisma db push`
- [ ] Start server: `yarn start:dev`
- [ ] Access API docs at `/api-docs`
- [ ] Open Telegram and search for your bot
- [ ] Send `/start` to bot
- [ ] Run your first scrape: `/scrape Route 9, Freehold, NJ`
- [ ] Enrich leads: `/enrich_batch 10`
- [ ] Generate outreach: `/outreach [id]`

**You're all set! Happy networking! 🚀**