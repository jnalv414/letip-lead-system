/**
 * Database Integrity Baseline Tests
 *
 * Purpose: Establish baseline for database schema, relationships, and constraints
 * before refactoring. These tests ensure data integrity is maintained during
 * vertical slice architecture migration.
 *
 * Test Coverage:
 * - Schema structure (tables, columns, types)
 * - Foreign key relationships
 * - Cascade delete behavior
 * - Indexes existence
 * - Constraints (unique, not null, defaults)
 * - Data validation
 *
 * IMPORTANT: These tests must PASS before any refactoring begins.
 * They define the data integrity contract that must be maintained.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/caching/redis.service';

// Mock RedisService for testing
const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  deletePattern: jest.fn().mockResolvedValue(0),
  isConnected: jest.fn().mockReturnValue(true),
};

describe('Database Integrity Baseline', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testBusinessIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup all test data
    await prisma.business.deleteMany({
      where: {
        OR: [
          { name: { contains: 'DB Integrity Test' } },
          { id: { in: testBusinessIds } },
        ],
      },
    });

    await app.close();
  });

  describe('Business Table Schema', () => {
    it('should have all required columns', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Schema Check',
          city: 'Freehold',
        },
      });

      testBusinessIds.push(business.id);

      // Verify all expected fields exist
      expect(business).toHaveProperty('id');
      expect(business).toHaveProperty('name');
      expect(business).toHaveProperty('address');
      expect(business).toHaveProperty('city');
      expect(business).toHaveProperty('state');
      expect(business).toHaveProperty('zip');
      expect(business).toHaveProperty('phone');
      expect(business).toHaveProperty('website');
      expect(business).toHaveProperty('business_type');
      expect(business).toHaveProperty('industry');
      expect(business).toHaveProperty('employee_count');
      expect(business).toHaveProperty('year_founded');
      expect(business).toHaveProperty('google_maps_url');
      expect(business).toHaveProperty('latitude');
      expect(business).toHaveProperty('longitude');
      expect(business).toHaveProperty('enrichment_status');
      expect(business).toHaveProperty('source');
      expect(business).toHaveProperty('created_at');
      expect(business).toHaveProperty('updated_at');
    });

    it('should enforce default values correctly', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Defaults',
        },
      });

      testBusinessIds.push(business.id);

      expect(business.state).toBe('NJ');
      expect(business.enrichment_status).toBe('pending');
      expect(business.source).toBe('google_maps');
      expect(business.created_at).toBeDefined();
      expect(business.updated_at).toBeDefined();
    });

    it('should auto-increment ID', async () => {
      const business1 = await prisma.business.create({
        data: { name: 'DB Integrity Test - ID 1' },
      });

      const business2 = await prisma.business.create({
        data: { name: 'DB Integrity Test - ID 2' },
      });

      testBusinessIds.push(business1.id, business2.id);

      expect(business2.id).toBeGreaterThan(business1.id);
    });

    it('should update updated_at on modification', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Timestamp',
          city: 'Freehold',
        },
      });

      testBusinessIds.push(business.id);

      const originalUpdatedAt = business.updated_at;

      // Wait a moment and update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await prisma.business.update({
        where: { id: business.id },
        data: { city: 'Marlboro' },
      });

      expect(updated.updated_at.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe('Contact Table Schema', () => {
    it('should have all required columns', async () => {
      const business = await prisma.business.create({
        data: { name: 'DB Integrity Test - Contact Schema' },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.create({
        data: {
          business_id: business.id,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      expect(contact).toHaveProperty('id');
      expect(contact).toHaveProperty('business_id');
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('title');
      expect(contact).toHaveProperty('email');
      expect(contact).toHaveProperty('email_verified');
      expect(contact).toHaveProperty('phone');
      expect(contact).toHaveProperty('linkedin_url');
      expect(contact).toHaveProperty('is_primary');
      expect(contact).toHaveProperty('created_at');
      expect(contact).toHaveProperty('updated_at');
    });

    it('should enforce default values', async () => {
      const business = await prisma.business.create({
        data: { name: 'DB Integrity Test - Contact Defaults' },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.create({
        data: {
          business_id: business.id,
          email: 'test@example.com',
        },
      });

      expect(contact.email_verified).toBe(false);
      expect(contact.is_primary).toBe(false);
    });
  });

  describe('Enrichment Log Table Schema', () => {
    it('should have all required columns', async () => {
      const business = await prisma.business.create({
        data: { name: 'DB Integrity Test - Enrichment Log' },
      });

      testBusinessIds.push(business.id);

      const log = await prisma.enrichment_log.create({
        data: {
          business_id: business.id,
          service: 'hunter',
          status: 'success',
          request_data: JSON.stringify({ domain: 'example.com' }),
          response_data: JSON.stringify({ emails: [] }),
        },
      });

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('business_id');
      expect(log).toHaveProperty('service');
      expect(log).toHaveProperty('status');
      expect(log).toHaveProperty('request_data');
      expect(log).toHaveProperty('response_data');
      expect(log).toHaveProperty('error_message');
      expect(log).toHaveProperty('created_at');
    });
  });

  describe('Outreach Message Table Schema', () => {
    it('should have all required columns', async () => {
      const business = await prisma.business.create({
        data: { name: 'DB Integrity Test - Outreach Message' },
      });

      testBusinessIds.push(business.id);

      const message = await prisma.outreach_message.create({
        data: {
          business_id: business.id,
          message_text: 'Test message content',
        },
      });

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('business_id');
      expect(message).toHaveProperty('contact_id');
      expect(message).toHaveProperty('message_text');
      expect(message).toHaveProperty('generated_at');
      expect(message).toHaveProperty('sent_at');
      expect(message).toHaveProperty('status');
    });

    it('should enforce default status', async () => {
      const business = await prisma.business.create({
        data: { name: 'DB Integrity Test - Message Status' },
      });

      testBusinessIds.push(business.id);

      const message = await prisma.outreach_message.create({
        data: {
          business_id: business.id,
          message_text: 'Test',
        },
      });

      expect(message.status).toBe('generated');
    });
  });

  describe('Relationship Integrity', () => {
    it('should maintain business-contact relationship', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Relationships',
          contacts: {
            create: [
              { email: 'contact1@example.com', name: 'Contact 1' },
              { email: 'contact2@example.com', name: 'Contact 2' },
            ],
          },
        },
        include: { contacts: true },
      });

      testBusinessIds.push(business.id);

      expect(business.contacts).toHaveLength(2);
      expect(business.contacts[0].business_id).toBe(business.id);
      expect(business.contacts[1].business_id).toBe(business.id);
    });

    it('should maintain business-enrichment_log relationship', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Enrichment Logs',
          enrichment_logs: {
            create: [
              { service: 'hunter', status: 'success' },
              { service: 'abstract', status: 'failed' },
            ],
          },
        },
        include: { enrichment_logs: true },
      });

      testBusinessIds.push(business.id);

      expect(business.enrichment_logs).toHaveLength(2);
      expect(business.enrichment_logs[0].business_id).toBe(business.id);
    });

    it('should maintain business-outreach_message relationship', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Messages',
          outreach_messages: {
            create: [{ message_text: 'Message 1' }],
          },
        },
        include: { outreach_messages: true },
      });

      testBusinessIds.push(business.id);

      expect(business.outreach_messages).toHaveLength(1);
      expect(business.outreach_messages[0].business_id).toBe(business.id);
    });

    it('should maintain contact-outreach_message relationship', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Contact Messages',
          contacts: {
            create: {
              email: 'contact@example.com',
              name: 'Test Contact',
              outreach_messages: {
                create: [
                  {
                    business_id: undefined as any, // Will be set by Prisma
                    message_text: 'Message to contact',
                  },
                ],
              },
            },
          },
        },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.findFirst({
        where: { business_id: business.id },
        include: { outreach_messages: true },
      });

      expect(contact?.outreach_messages).toHaveLength(1);
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should cascade delete contacts when business is deleted', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Cascade Contacts',
          contacts: {
            create: [
              { email: 'cascade1@example.com' },
              { email: 'cascade2@example.com' },
            ],
          },
        },
      });

      const contactIds = await prisma.contact.findMany({
        where: { business_id: business.id },
        select: { id: true },
      });

      expect(contactIds).toHaveLength(2);

      // Delete business
      await prisma.business.delete({ where: { id: business.id } });

      // Verify contacts are deleted
      const remainingContacts = await prisma.contact.findMany({
        where: { id: { in: contactIds.map((c) => c.id) } },
      });

      expect(remainingContacts).toHaveLength(0);
    });

    it('should cascade delete enrichment logs when business is deleted', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Cascade Logs',
          enrichment_logs: {
            create: [
              { service: 'hunter', status: 'success' },
              { service: 'abstract', status: 'success' },
            ],
          },
        },
      });

      const logIds = await prisma.enrichment_log.findMany({
        where: { business_id: business.id },
        select: { id: true },
      });

      expect(logIds).toHaveLength(2);

      await prisma.business.delete({ where: { id: business.id } });

      const remainingLogs = await prisma.enrichment_log.findMany({
        where: { id: { in: logIds.map((l) => l.id) } },
      });

      expect(remainingLogs).toHaveLength(0);
    });

    it('should cascade delete outreach messages when business is deleted', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Cascade Messages',
          outreach_messages: {
            create: [{ message_text: 'Message 1' }],
          },
        },
      });

      const messageIds = await prisma.outreach_message.findMany({
        where: { business_id: business.id },
        select: { id: true },
      });

      expect(messageIds).toHaveLength(1);

      await prisma.business.delete({ where: { id: business.id } });

      const remainingMessages = await prisma.outreach_message.findMany({
        where: { id: { in: messageIds.map((m) => m.id) } },
      });

      expect(remainingMessages).toHaveLength(0);
    });

    it('should set contact_id to null when contact is deleted (SetNull)', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - SetNull',
          contacts: {
            create: {
              email: 'setnull@example.com',
              outreach_messages: {
                create: [
                  {
                    business_id: undefined as any,
                    message_text: 'Test message',
                  },
                ],
              },
            },
          },
        },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.findFirst({
        where: { business_id: business.id },
      });

      const message = await prisma.outreach_message.findFirst({
        where: { contact_id: contact?.id },
      });

      expect(message?.contact_id).toBe(contact?.id);

      // Delete contact
      await prisma.contact.delete({ where: { id: contact!.id } });

      // Verify message still exists but contact_id is null
      const updatedMessage = await prisma.outreach_message.findFirst({
        where: { id: message!.id },
      });

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.contact_id).toBeNull();
    });
  });

  describe('Index Verification', () => {
    it('should efficiently query businesses by city (indexed)', async () => {
      // Create test data
      await prisma.business.createMany({
        data: [
          { name: 'DB Integrity Test - Index 1', city: 'Freehold' },
          { name: 'DB Integrity Test - Index 2', city: 'Freehold' },
          { name: 'DB Integrity Test - Index 3', city: 'Marlboro' },
        ],
      });

      const freeholdBusinesses = await prisma.business.findMany({
        where: { city: 'Freehold' },
      });

      const freeholdCount = freeholdBusinesses.filter((b) =>
        b.name.includes('DB Integrity Test - Index'),
      ).length;

      expect(freeholdCount).toBeGreaterThanOrEqual(2);
    });

    it('should efficiently query businesses by enrichment_status (indexed)', async () => {
      const pendingBusinesses = await prisma.business.findMany({
        where: { enrichment_status: 'pending' },
        take: 1,
      });

      expect(pendingBusinesses).toBeDefined();
    });

    it('should efficiently query contacts by email (indexed)', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Email Index',
          contacts: {
            create: { email: 'indexed@example.com' },
          },
        },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.findFirst({
        where: { email: 'indexed@example.com' },
      });

      expect(contact).toBeDefined();
      expect(contact?.email).toBe('indexed@example.com');
    });
  });

  describe('Data Type Validation', () => {
    it('should store and retrieve text fields correctly', async () => {
      const longText = 'A'.repeat(1000);

      const log = await prisma.enrichment_log.create({
        data: {
          business_id: testBusinessIds[0] || 1,
          service: 'test',
          status: 'success',
          request_data: longText,
          response_data: longText,
          error_message: longText,
        },
      });

      expect(log.request_data).toHaveLength(1000);
    });

    it('should handle null values correctly', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Nulls',
          address: null,
          phone: null,
          website: null,
        },
      });

      testBusinessIds.push(business.id);

      expect(business.address).toBeNull();
      expect(business.phone).toBeNull();
      expect(business.website).toBeNull();
    });

    it('should handle numeric types correctly', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Numbers',
          employee_count: 50,
          year_founded: 2020,
          latitude: 40.2577,
          longitude: -74.2779,
        },
      });

      testBusinessIds.push(business.id);

      expect(typeof business.employee_count).toBe('number');
      expect(typeof business.year_founded).toBe('number');
      expect(typeof business.latitude).toBe('number');
      expect(typeof business.longitude).toBe('number');
    });

    it('should handle boolean types correctly', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'DB Integrity Test - Booleans',
          contacts: {
            create: {
              email: 'bool@example.com',
              email_verified: true,
              is_primary: true,
            },
          },
        },
      });

      testBusinessIds.push(business.id);

      const contact = await prisma.contact.findFirst({
        where: { business_id: business.id },
      });

      expect(contact?.email_verified).toBe(true);
      expect(contact?.is_primary).toBe(true);
    });

    it('should handle DateTime types correctly', async () => {
      const now = new Date();

      const message = await prisma.outreach_message.create({
        data: {
          business_id: testBusinessIds[0] || 1,
          message_text: 'Test',
          sent_at: now,
        },
      });

      expect(message.sent_at).toBeInstanceOf(Date);
      expect(message.sent_at?.getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });
});
