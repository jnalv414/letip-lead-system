
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ScraperService } from '../scraper/scraper.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { OutreachService } from '../outreach/outreach.service';
import TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;

  constructor(
    private configService: ConfigService,
    private businessesService: BusinessesService,
    private scraperService: ScraperService,
    private enrichmentService: EnrichmentService,
    private outreachService: OutreachService,
  ) {}

  async onModuleInit() {
    const token = this.configService.getTelegramBotToken();
    
    if (!token) {
      this.logger.warn('Telegram bot token not configured. Bot will not start.');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.setupHandlers();
      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start Telegram bot:', error);
    }
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      this.handleStart(msg);
    });

    // Stats command
    this.bot.onText(/\/stats/, (msg) => {
      this.handleStats(msg);
    });

    // Scrape command
    this.bot.onText(/\/scrape (.+)/, (msg, match) => {
      if (match && match[1]) {
        this.handleScrape(msg, match[1]);
      }
    });

    // Leads command
    this.bot.onText(/\/leads(?:\s+(.+))?/, (msg, match) => {
      this.handleLeads(msg, match && match[1] ? match[1] : null);
    });

    // Enrich single business
    this.bot.onText(/\/enrich (\d+)/, (msg, match) => {
      if (match && match[1]) {
        this.handleEnrich(msg, parseInt(match[1]));
      }
    });

    // Enrich batch
    this.bot.onText(/\/enrich_batch(?:\s+(\d+))?/, (msg, match) => {
      this.handleEnrichBatch(msg, match && match[1] ? parseInt(match[1]) : 10);
    });

    // Outreach message
    this.bot.onText(/\/outreach (\d+)/, (msg, match) => {
      if (match && match[1]) {
        this.handleOutreach(msg, parseInt(match[1]));
      }
    });

    // Export command
    this.bot.onText(/\/export/, (msg) => {
      this.handleExport(msg);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      this.handleStart(msg);
    });

    this.logger.log('Telegram bot handlers registered');
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🎯 *Le Tip Lead System*

Welcome to the Le Tip of Western Monmouth business lead management system!

*Available Commands:*

📊 /stats - View system statistics
🔍 /scrape [location] - Scrape businesses from Google Maps
📋 /leads [filters] - List recent leads
💎 /enrich [id] - Enrich specific business
⚡ /enrich_batch [count] - Enrich multiple pending leads
✉️ /outreach [id] - Generate outreach message
📤 /export - Export leads to CSV
❓ /help - Show this help message

*Examples:*
• \`/scrape Route 9, Freehold, NJ\`
• \`/leads city:Freehold\`
• \`/enrich 123\`
• \`/enrich_batch 20\`
• \`/outreach 123\`

Let me know how I can help! 🚀
    `;

    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  private async handleStats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(chatId, '📊 Fetching statistics...');

      const stats = await this.businessesService.getStats();

      const statsMessage = `
📊 *Lead System Statistics*

*Overall:*
• Total Businesses: ${stats.total}
• Enriched: ${stats.enriched} (${stats.total > 0 ? Math.round((stats.enriched / stats.total) * 100) : 0}%)
• Pending: ${stats.pending}
• Failed: ${stats.failed}

*Top Cities:*
${stats.byCity.slice(0, 5).map((c, i) => `${i + 1}. ${c.city || 'Unknown'}: ${c.count}`).join('\n')}

*Top Industries:*
${stats.byIndustry.slice(0, 5).map((i, idx) => `${idx + 1}. ${i.industry || 'Unknown'}: ${i.count}`).join('\n')}
      `;

      await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling stats command:', error);
      await this.bot.sendMessage(chatId, '❌ Error fetching statistics. Please try again.');
    }
  }

  private async handleScrape(msg: TelegramBot.Message, location: string) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(
        chatId,
        `🔍 Starting to scrape businesses near: *${location}*\n\nThis may take a few minutes...`,
        { parse_mode: 'Markdown' }
      );

      const result = await this.scraperService.scrapeGoogleMaps({
        location,
        radius: 1,
        max_results: 50,
      });

      const resultMessage = `
✅ *Scraping Complete!*

• Found: ${result.found} businesses
• Saved: ${result.saved} new businesses
• Skipped: ${result.skipped} duplicates
${result.errors && result.errors.length > 0 ? `• Errors: ${result.errors.length}` : ''}

Use /leads to view the scraped businesses.
      `;

      await this.bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling scrape command:', error);
      await this.bot.sendMessage(chatId, `❌ Error during scraping: ${error.message}`);
    }
  }

  private async handleLeads(msg: TelegramBot.Message, filters: string | null) {
    const chatId = msg.chat.id;

    try {
      const query: any = { page: 1, limit: 10 };

      // Parse filters (e.g., "city:Freehold" or "status:pending")
      if (filters) {
        const parts = filters.split(':');
        if (parts.length === 2) {
          const [key, value] = parts;
          if (key === 'city') query.city = value;
          else if (key === 'status') query.enrichment_status = value;
        }
      }

      const result = await this.businessesService.findAll(query);

      if (result.data.length === 0) {
        await this.bot.sendMessage(chatId, '📋 No leads found matching your criteria.');
        return;
      }

      const leadsMessage = `
📋 *Recent Leads* (Page ${result.meta.page}/${result.meta.totalPages})

${result.data.map((b, i) => `
${i + 1}. *${b.name}* (ID: ${b.id})
   📍 ${b.city || 'Unknown'}, ${b.state || 'NJ'}
   🏢 ${b.industry || 'N/A'}
   ✅ Status: ${b.enrichment_status}
   👥 Contacts: ${b.contacts?.length || 0}
`).join('\n')}

Total: ${result.meta.total} businesses
      `;

      await this.bot.sendMessage(chatId, leadsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling leads command:', error);
      await this.bot.sendMessage(chatId, '❌ Error fetching leads. Please try again.');
    }
  }

  private async handleEnrich(msg: TelegramBot.Message, businessId: number) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(chatId, `💎 Enriching business ID: ${businessId}...`);

      const result = await this.enrichmentService.enrichBusiness(businessId);

      const enrichMessage = `
✅ *Enrichment Complete*

Business: ${result.businessName} (ID: ${result.businessId})

${result.abstract ? '✓ AbstractAPI: Success' : '✗ AbstractAPI: Failed'}
${result.hunter ? '✓ Hunter.io: Success' : '✗ Hunter.io: Failed'}

${result.errors.length > 0 ? `\n⚠️ Errors:\n${result.errors.map(e => `• ${e.service}: ${e.error}`).join('\n')}` : ''}
      `;

      await this.bot.sendMessage(chatId, enrichMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling enrich command:', error);
      await this.bot.sendMessage(chatId, `❌ Error enriching business: ${error.message}`);
    }
  }

  private async handleEnrichBatch(msg: TelegramBot.Message, count: number) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(
        chatId,
        `⚡ Starting batch enrichment for ${count} businesses...\n\nThis may take several minutes.`
      );

      const result = await this.enrichmentService.enrichBatch(count);

      const batchMessage = `
✅ *Batch Enrichment Complete*

• Total Processed: ${result.total}
• Successfully Enriched: ${result.enriched}
• Failed: ${result.failed}

Use /leads status:enriched to view enriched businesses.
      `;

      await this.bot.sendMessage(chatId, batchMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling enrich_batch command:', error);
      await this.bot.sendMessage(chatId, `❌ Error during batch enrichment: ${error.message}`);
    }
  }

  private async handleOutreach(msg: TelegramBot.Message, businessId: number) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(chatId, `✉️ Generating outreach message for business ID: ${businessId}...`);

      const message = await this.outreachService.generateOutreachMessage(businessId);

      const outreachMessage = `
✅ *Outreach Message Generated*

Business ID: ${businessId}

---
${message.message_text}
---

Status: ${message.status}
Generated: ${new Date(message.generated_at).toLocaleString()}
      `;

      await this.bot.sendMessage(chatId, outreachMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error handling outreach command:', error);
      await this.bot.sendMessage(chatId, `❌ Error generating outreach message: ${error.message}`);
    }
  }

  private async handleExport(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(chatId, '📤 Preparing export...');

      const businesses = await this.businessesService.findAll({ page: 1, limit: 1000 });

      if (businesses.data.length === 0) {
        await this.bot.sendMessage(chatId, '📋 No businesses to export.');
        return;
      }

      // Create CSV content
      const headers = 'ID,Name,Address,City,State,ZIP,Phone,Website,Industry,Business Type,Employee Count,Year Founded,Enrichment Status,Contacts Count\n';
      const rows = businesses.data.map(b => 
        `${b.id},"${b.name || ''}","${b.address || ''}","${b.city || ''}","${b.state || ''}","${b.zip || ''}","${b.phone || ''}","${b.website || ''}","${b.industry || ''}","${b.business_type || ''}",${b.employee_count || ''},${b.year_founded || ''},"${b.enrichment_status}",${b.contacts?.length || 0}`
      ).join('\n');

      const csv = headers + rows;

      // Send as document
      await this.bot.sendDocument(
        chatId,
        Buffer.from(csv, 'utf-8'),
        {
          caption: `📊 Exported ${businesses.data.length} businesses`,
        },
        {
          filename: `letip_leads_${new Date().toISOString().split('T')[0]}.csv`,
          contentType: 'text/csv',
        }
      );
    } catch (error) {
      this.logger.error('Error handling export command:', error);
      await this.bot.sendMessage(chatId, '❌ Error exporting data. Please try again.');
    }
  }

  async sendNotification(message: string) {
    // This method can be used to send notifications from other services
    // You would need to store admin chat IDs to use this
    this.logger.log(`Notification: ${message}`);
  }
}
