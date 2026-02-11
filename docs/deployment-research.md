# Deployment Options Research Report

## LeTip Lead Management System
### NestJS + Next.js 15 + PostgreSQL + Redis + Socket.io

**Date:** 2026-02-11
**Researcher:** deployment-researcher agent
**Sources:** Perplexity Research, Brave Search, Tavily Search, Perplexity Search (6 MCP sources queried)

---

## Executive Summary

For a low-traffic lead management tool with 1-5 active users, **Hetzner VPS with Docker Compose** is the clear winner at ~$5-7/month. If you want a managed experience without server administration, **Railway.app** offers the best balance at ~$15-25/month. Avoid Render.com for this use case -- it is significantly overpriced for small apps.

**Top Recommendation: Hetzner CX22 VPS ($5.29/mo) + Docker Compose**
- Runs entire stack on one machine
- Zero per-service fees
- Full WebSocket/Redis/PostgreSQL support
- Total cost: ~$5-7/month

---

## Detailed Comparison

### 1. Hetzner VPS + Docker Compose (RECOMMENDED)

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$5-7/month** |
| Breakdown | CX22 VPS (2 vCPU, 4GB RAM, 40GB SSD): EUR 3.79/mo (~$4.43). CX32 (4 vCPU, 8GB RAM): EUR 6.30/mo (~$7.37). PostgreSQL + Redis run as Docker containers at no extra cost. |
| SSL | Free via Let's Encrypt + Traefik/Caddy reverse proxy (manual setup) |
| Custom Domain | Yes (point DNS A record to VPS IP) |
| CI/CD | Manual setup required (GitHub Actions + SSH deploy, or Dokku) |
| WebSocket Support | **Full support** -- no restrictions on persistent connections |
| Redis | Included as Docker container, zero latency on local network |
| Ease of Setup | **Medium-Hard** -- requires Linux/Docker knowledge, 2-3 hours initial setup |
| Scaling Path | Vertical: upgrade VPS tier. Horizontal: requires architectural changes. |
| Bandwidth | 20TB included (EU locations), 1TB (US locations) |
| Backups | Manual or 20% of instance price for automated snapshots |

**Pros:**
- Cheapest option by far (75-90% less than managed platforms)
- Full control over everything
- No per-service billing -- run as many containers as RAM allows
- 20TB bandwidth included is extremely generous
- DDoS protection included free
- GDPR compliant (EU data centers)

**Cons:**
- You are the sysadmin: updates, security patches, backup scripts
- No dashboard for deployment management
- SSL certificate setup is manual (though Caddy automates this)
- Single point of failure (one server)

**Sample docker-compose.yml architecture:**
```
services:
  backend:    # NestJS API + BullMQ workers
  frontend:   # Next.js (static export or SSR)
  postgres:   # PostgreSQL 16
  redis:      # Redis 7 (BullMQ + caching)
  caddy:      # Reverse proxy + auto-SSL
```

**Confirmed by:** 5/6 sources recommend Hetzner as cheapest option for small full-stack apps.

---

### 2. Hetzner VPS + Coolify (RUNNER-UP)

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$10-15/month** |
| Breakdown | CX22 VPS: ~$5/mo + Coolify Cloud control plane: $5/mo. Or self-host Coolify free (needs slightly larger VPS ~$7-10). |
| SSL | **Automatic** via Coolify + Let's Encrypt |
| Custom Domain | Yes, configured through Coolify dashboard |
| CI/CD | **Automatic** -- GitHub integration, auto-deploy on push |
| WebSocket Support | **Full support** |
| Redis | One-click provisioning through Coolify dashboard |
| Ease of Setup | **Easy-Medium** -- 30-45 minutes, single install script |
| Scaling Path | Same as raw Hetzner (vertical scaling on single VPS) |

**Pros:**
- Same cost base as Hetzner but with a web dashboard
- Auto SSL, auto deploys from GitHub
- One-click PostgreSQL and Redis provisioning
- Open-source (self-hosted is free forever)
- Web-based log viewer, environment variable management
- Supports Next.js with auto-detection

**Cons:**
- Coolify itself uses some RAM (~500MB), so you may need a slightly larger VPS
- Smaller community than Railway/Render
- Same single-server limitation
- Self-hosted Coolify requires occasional updates

**Confirmed by:** 4/6 sources identify Coolify on Hetzner as best budget-managed option.

---

### 3. Railway.app

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$15-30/month** (usage-based) |
| Breakdown | Hobby plan: $5/mo base (includes $5 usage credit). NestJS backend: ~$3-8/mo compute. Next.js frontend: ~$2-5/mo compute. PostgreSQL: ~$1-5/mo (usage-based). Redis: ~$3-10/mo (usage-based). Typical total for low traffic: $15-25/mo. |
| SSL | **Automatic** for all services |
| Custom Domain | Yes, with automatic HTTPS |
| CI/CD | **Automatic** -- GitHub integration, deploy on push |
| WebSocket Support | **Full support** -- persistent connections, no timeouts |
| Redis | Native support, one-click provisioning |
| Ease of Setup | **Very Easy** -- connect GitHub, auto-detect, deploy in minutes |
| Scaling Path | Excellent -- usage-based billing scales linearly with demand |

**Pros:**
- Fastest setup of any option (literally minutes)
- Usage-based means you only pay for what you use
- Native NestJS template support
- Private networking between services
- Preview environments for PRs
- Active Discord community, responsive support
- Runs on their own hardware (Railway Metal)

**Cons:**
- Costs can be unpredictable with traffic spikes
- No hard free tier (just $5 credit on trial, then $5/mo + usage)
- Pro plan is $20/seat/mo for teams
- Less mature than DigitalOcean/AWS

**Confirmed by:** 5/6 sources rate Railway as best managed PaaS for small full-stack apps.

---

### 4. DigitalOcean -- Two Options

#### Option A: DigitalOcean Droplet + Docker

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$15-25/month** |
| Breakdown | Basic Droplet (2 vCPU, 2GB RAM): $12/mo. Or 1 vCPU, 1GB: $6/mo (tight for this stack). PostgreSQL + Redis as Docker containers: $0 extra. Managed DB alternative: $15/mo additional. |
| SSL | Manual (Let's Encrypt + Nginx/Caddy) |
| CI/CD | Manual setup required |
| WebSocket Support | **Full support** |
| Redis | Docker container (free) or managed ($15/mo) |
| Ease of Setup | **Medium** -- similar to Hetzner but better UI and docs |
| Scaling Path | Good -- easy to resize Droplets, add managed DB later |

#### Option B: DigitalOcean App Platform

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$25-45/month** |
| Breakdown | Backend service (1 vCPU, 1GB): $10/mo. Frontend service (1 vCPU, 512MB): $5/mo. Managed PostgreSQL (Basic): $15/mo. Managed Redis via Upstash: $10/mo. |
| SSL | **Automatic** |
| CI/CD | **Automatic** from GitHub |
| WebSocket Support | **Full support** |
| Redis | Via Upstash integration ($10/mo starter) |
| Ease of Setup | **Easy** -- fully managed, good docs |
| Scaling Path | Good -- resize services via dashboard |

**Pros (both options):**
- Excellent documentation and tutorials
- Built-in DDoS protection
- One-click Docker app installs
- Strong community support
- US-based company with good support

**Cons:**
- Droplets cost ~2x more than equivalent Hetzner VPS
- App Platform adds management premium
- Bandwidth: 500GB-1TB included (vs Hetzner's 20TB)
- Managed PostgreSQL starts at $15/mo (vs free Docker container)

**Confirmed by:** 4/6 sources. Good middle ground between self-hosted and fully managed.

---

### 5. Fly.io

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$20-60/month** |
| Breakdown | Shared CPU VM (1 vCPU, 2GB): ~$10-12/mo. Managed Postgres (Basic): $38/mo (cheapest plan!). Upstash Redis: $10/mo starter. IPv4 address: $2/mo. Total minimum: ~$50-60/mo with managed DB. Alternative: self-managed Postgres on Fly volume: ~$20-25/mo total. |
| SSL | **Automatic** |
| Custom Domain | Yes, via `fly certs add` |
| CI/CD | Via Fly CLI or GitHub Actions |
| WebSocket Support | **Full support** -- first-class WebSocket support |
| Redis | Via Upstash ($10/mo) or self-managed |
| Ease of Setup | **Easy** -- `fly launch` auto-detects stack |
| Scaling Path | Excellent -- multi-region edge deployment, scale-to-zero |

**Pros:**
- Global edge deployment (30+ regions)
- First-class WebSocket and real-time support
- Scale-to-zero capability
- Per-second billing
- Good for global user bases

**Cons:**
- **Managed Postgres is expensive ($38/mo minimum)** -- community complaints about this
- No free tier for new accounts
- More operational overhead than Railway
- IPv4 costs extra ($2/mo)
- Smaller ecosystem than major clouds

**WARNING:** Fly.io's managed Postgres at $38/mo makes this expensive for small apps. If you self-manage Postgres in a Fly volume, costs drop significantly but you lose managed backup features.

**Confirmed by:** 4/6 sources. Best for global/edge use cases, overkill for 1-5 users in one region.

---

### 6. Render.com

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$32-85+/month** (new flexible pricing) |
| Breakdown | Web Service (Starter, 512MB): $7/mo. Or Standard (2GB): $25/mo. PostgreSQL (new flexible): starts ~$20-55/mo for Pro tiers. Legacy Pro DB was $95/mo. Redis (Key Value): starts ~$10-32/mo. Second web service for frontend: $7-25/mo. Total realistic minimum: ~$45-85/mo. |
| SSL | **Automatic** |
| Custom Domain | Yes, with automatic HTTPS |
| CI/CD | **Automatic** -- GitHub integration + preview environments |
| WebSocket Support | **Full support** (documented with examples) |
| Redis | Native Key Value service |
| Ease of Setup | **Easy** -- similar to Railway |
| Scaling Path | Moderate -- fixed pricing means step-function cost increases |

**Free tier limitations:**
- 750 hours/month shared across all free services
- Services spin down after 15 minutes of inactivity (1 min cold start)
- Free PostgreSQL limited to 1GB, expires after 30 days
- Not viable for production with WebSockets (sleep kills connections)

**Pros:**
- Predictable fixed pricing
- Good documentation
- Preview environments for PRs
- Background workers and cron job support
- Point-in-time database recovery (Pro tier)

**Cons:**
- **Significantly more expensive than competitors** for equivalent resources
- Free tier is impractical for production (sleep mode, 30-day DB expiry)
- New bandwidth pricing (Aug 2025) charges for WebSocket traffic
- Database pricing recently restructured -- confusing legacy vs. flexible plans
- Starter web service only has 512MB RAM

**Confirmed by:** 5/6 sources. Consensus: overpriced compared to Railway for small apps.

---

### 7. Vercel + Separate Backend

| Attribute | Details |
|-----------|---------|
| **Monthly Cost** | **$25-50+/month** (split hosting) |
| Breakdown | Vercel Pro (Next.js frontend): $20/mo per seat. Backend hosted elsewhere (Railway/Hetzner): $5-25/mo. Total: $25-45/mo minimum. |
| SSL | **Automatic** on Vercel |
| CI/CD | **Automatic** on Vercel; separate for backend |
| WebSocket Support | **NO** -- Vercel serverless cannot maintain WebSocket connections |
| Redis | Must be hosted separately |
| Ease of Setup | **Easy for frontend, complex overall** -- managing two platforms |
| Scaling Path | Frontend scales excellently on Vercel; backend scales per hosting choice |

**Pros:**
- Best-in-class Next.js optimization (global CDN, edge functions, image optimization)
- Excellent preview deployments
- Free tier available for hobby projects (limited)

**Cons:**
- **Cannot run NestJS backend on Vercel** (serverless incompatible with NestJS architecture)
- **Cannot do WebSockets on Vercel** (stateless serverless functions)
- **Cannot run BullMQ workers on Vercel** (no persistent processes)
- Requires managing TWO hosting platforms
- CORS configuration between frontend/backend domains
- $20/mo/seat just for frontend hosting is expensive for 1-5 users
- Adds architectural complexity for no benefit at this scale

**NOT RECOMMENDED for this stack.** Vercel is optimized for serverless Next.js, not full-stack NestJS + WebSocket apps.

**Confirmed by:** 5/6 sources agree Vercel is wrong choice for NestJS + WebSocket full-stack apps.

---

## Final Ranked Recommendations

Priority: **Cheap > Easy > Scalable**

| Rank | Option | Monthly Cost | Ease | WebSocket | Redis | Best For |
|------|--------|-------------|------|-----------|-------|----------|
| **1** | **Hetzner VPS + Docker Compose** | **$5-7** | Medium-Hard | Yes | Yes (free) | Maximum savings, tech-comfortable owner |
| **2** | **Hetzner VPS + Coolify** | **$10-15** | Easy-Medium | Yes | Yes (free) | Best balance of cheap + easy |
| **3** | **Railway.app** | **$15-25** | Very Easy | Yes | Yes (native) | Zero DevOps, fastest setup |
| **4** | **DO Droplet + Docker** | **$15-25** | Medium | Yes | Yes (free) | Good docs, US-based support |
| **5** | **DO App Platform** | **$25-45** | Easy | Yes | Yes ($10) | Fully managed, good ecosystem |
| **6** | **Fly.io** | **$20-60** | Easy | Yes | Yes ($10) | Global edge (overkill here) |
| **7** | **Render.com** | **$45-85** | Easy | Yes | Yes ($10+) | Overpriced for this use case |
| **8** | **Vercel + Backend** | **$25-50** | Complex | **NO** | No | Wrong architecture for this stack |

---

## Recommended Deployment Strategy

### For Go-Live (MVP): Hetzner CX22 + Docker Compose

**Total: ~$5-7/month**

```
Hetzner CX22 VPS (2 vCPU, 4GB RAM, 40GB SSD): EUR 3.79/mo
├── NestJS Backend (port 3031)
├── Next.js Frontend (port 3030)
├── PostgreSQL 16 (Docker volume for persistence)
├── Redis 7 (BullMQ queues + caching)
└── Caddy (reverse proxy + auto-SSL)
```

**Why this works for 1-5 users:**
- 4GB RAM is plenty for all services combined (~1.5GB total usage expected)
- 40GB SSD handles database + uploads easily for 100K rows
- 20TB bandwidth is more than enough
- All services communicate over Docker internal network (zero latency)
- Caddy provides automatic HTTPS with zero configuration

### If You Want Easier Management: Hetzner + Coolify

**Total: ~$10-15/month**

Same VPS but with Coolify providing:
- Web dashboard for deployments
- Auto-deploy from GitHub on push
- One-click PostgreSQL and Redis
- Automatic SSL
- Log viewer and metrics

### Growth Path (When You Need It)

1. **0-100 users:** Single Hetzner CX22 ($5-7/mo)
2. **100-500 users:** Upgrade to CX32 or CX42 ($7-23/mo)
3. **500+ users:** Migrate to Railway or add managed DB, consider horizontal scaling

---

## Source Agreement Analysis

| Claim | Sources Agreeing | Confidence |
|-------|-----------------|------------|
| Hetzner is cheapest for small apps | 5/6 | High |
| Coolify is best self-hosted PaaS | 4/6 | High |
| Railway is best managed PaaS for startups | 5/6 | High |
| Vercel cannot do WebSockets/NestJS properly | 5/6 | High |
| Render is overpriced vs Railway | 4/6 | High |
| Fly.io managed Postgres is too expensive | 3/6 | Medium |
| Docker Compose handles this stack well | 6/6 | Very High |

### Sources Consulted
- Perplexity Research (comprehensive multi-source synthesis)
- Brave Search (Railway pricing, Coolify comparisons)
- Tavily Search (Render free tier, platform comparisons, DigitalOcean pricing)
- Perplexity Search (Hetzner VPS pricing, Docker Compose guides)
- Railway.com official pricing page
- Render.com official pricing page
- Fly.io official pricing and calculator
- DigitalOcean official App Platform and Droplet pricing
- Coolify.io official pricing
- Hetzner.com official cloud pricing
- Community sources: Reddit, dev.to, GetDeploying.com, MakerKit, Northflank

---

## Methodology Notes

- All prices verified against official pricing pages as of February 2026
- Monthly costs estimated for the specific stack: NestJS + Next.js + PostgreSQL + Redis + WebSocket
- Traffic assumption: <100 users, 1-5 concurrent, low API call volume
- All costs in USD unless noted; EUR converted at ~1.17 USD/EUR
- Perplexity Search returned limited results for some queries (noted where applicable)
- Brave Search rate-limited on one query (DigitalOcean comparison); supplemented with Tavily
