import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis.service';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Redis client
    mockRedisClient = {
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
      dbsize: jest.fn(),
      keys: jest.fn(),
      flushdb: jest.fn(),
      scanStream: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      status: 'ready',
    } as any;

    // Mock Redis constructor
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Manually initialize to avoid real Redis connection
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('Connection Management', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Redis client on module init', async () => {
      expect(Redis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          retryStrategy: expect.any(Function),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        }),
      );
    });

    it('should ping Redis on initialization', async () => {
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return true for isAvailable when connected', () => {
      mockRedisClient.status = 'ready';
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false for isAvailable when disconnected', () => {
      mockRedisClient.status = 'close';
      expect(service.isAvailable()).toBe(false);
    });

    it('should ping successfully when connected', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.status = 'ready';

      const result = await service.ping();

      expect(result).toBe('PONG');
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return null on ping when disconnected', async () => {
      mockRedisClient.status = 'close';

      const result = await service.ping();

      expect(result).toBeNull();
    });
  });

  describe('get()', () => {
    it('should return cached value when key exists', async () => {
      const testData = { id: 1, name: 'Test Business' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
      mockRedisClient.status = 'ready';

      const result = await service.get('business:1');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('business:1');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.status = 'ready';

      const result = await service.get('missing:key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('missing:key');
    });

    it('should return null when Redis is unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.get('test:key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json{');
      mockRedisClient.status = 'ready';

      const result = await service.get('test:key');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection refused'));
      mockRedisClient.status = 'ready';

      const result = await service.get('test:key');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('should store value without TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.status = 'ready';

      await service.set('test:key', testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith('test:key', JSON.stringify(testData));
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });

    it('should store value with TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.status = 'ready';

      await service.set('test:key', testData, 30);

      expect(mockRedisClient.setex).toHaveBeenCalledWith('test:key', 30, JSON.stringify(testData));
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('should handle Redis unavailable gracefully', async () => {
      mockRedisClient.status = 'close';

      await service.set('test:key', { data: 'test' });

      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Write error'));
      mockRedisClient.status = 'ready';

      // Should not throw
      await expect(service.set('test:key', { data: 'test' }, 30)).resolves.toBeUndefined();
    });
  });

  describe('del()', () => {
    it('should delete a key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.status = 'ready';

      const result = await service.del('test:key');

      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
    });

    it('should return 0 when key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);
      mockRedisClient.status = 'ready';

      const result = await service.del('missing:key');

      expect(result).toBe(0);
    });

    it('should return 0 when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.del('test:key');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('delMany()', () => {
    it('should delete multiple keys', async () => {
      mockRedisClient.del.mockResolvedValue(3);
      mockRedisClient.status = 'ready';

      const result = await service.delMany(['key1', 'key2', 'key3']);

      expect(result).toBe(3);
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should return 0 for empty array', async () => {
      mockRedisClient.status = 'ready';

      const result = await service.delMany([]);

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should return 0 when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.delMany(['key1', 'key2']);

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidatePattern()', () => {
    it('should delete all keys matching pattern', async () => {
      interface MockStream {
        on: jest.Mock;
      }

      const mockStream: MockStream = {
        on: jest.fn(function (this: MockStream, event: string, callback: any) {
          if (event === 'data') {
            callback(['business:1', 'business:2']);
          }
          if (event === 'end') {
            setTimeout(callback, 0);
          }
          return this;
        }),
      };

      mockRedisClient.scanStream.mockReturnValue(mockStream as any);
      mockRedisClient.del.mockResolvedValue(2);
      mockRedisClient.status = 'ready';

      const result = await service.invalidatePattern('business:*');

      expect(result).toBe(2);
      expect(mockRedisClient.scanStream).toHaveBeenCalledWith({
        match: 'business:*',
        count: 100,
      });
      expect(mockRedisClient.del).toHaveBeenCalledWith('business:1', 'business:2');
    });

    it('should return 0 when no keys match', async () => {
      interface MockStream {
        on: jest.Mock;
      }

      const mockStream: MockStream = {
        on: jest.fn(function (this: MockStream, event: string, callback: any) {
          if (event === 'end') {
            setTimeout(callback, 0);
          }
          return this;
        }),
      };

      mockRedisClient.scanStream.mockReturnValue(mockStream as any);
      mockRedisClient.status = 'ready';

      const result = await service.invalidatePattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should return 0 when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.invalidatePattern('business:*');

      expect(result).toBe(0);
      expect(mockRedisClient.scanStream).not.toHaveBeenCalled();
    });
  });

  describe('ttl()', () => {
    it('should return TTL for key', async () => {
      mockRedisClient.ttl.mockResolvedValue(30);
      mockRedisClient.status = 'ready';

      const result = await service.ttl('test:key');

      expect(result).toBe(30);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test:key');
    });

    it('should return -1 for key with no TTL', async () => {
      mockRedisClient.ttl.mockResolvedValue(-1);
      mockRedisClient.status = 'ready';

      const result = await service.ttl('test:key');

      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedisClient.ttl.mockResolvedValue(-2);
      mockRedisClient.status = 'ready';

      const result = await service.ttl('missing:key');

      expect(result).toBe(-2);
    });

    it('should return null when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.ttl('test:key');

      expect(result).toBeNull();
    });
  });

  describe('dbSize()', () => {
    it('should return number of keys in database', async () => {
      mockRedisClient.dbsize.mockResolvedValue(42);
      mockRedisClient.status = 'ready';

      const result = await service.dbSize();

      expect(result).toBe(42);
      expect(mockRedisClient.dbsize).toHaveBeenCalled();
    });

    it('should return 0 when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.dbSize();

      expect(result).toBe(0);
      expect(mockRedisClient.dbsize).not.toHaveBeenCalled();
    });
  });

  describe('keys()', () => {
    it('should return all matching keys', async () => {
      mockRedisClient.keys.mockResolvedValue(['business:1', 'business:2']);
      mockRedisClient.status = 'ready';

      const result = await service.keys('business:*');

      expect(result).toEqual(['business:1', 'business:2']);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('business:*');
    });

    it('should return empty array when no keys match', async () => {
      mockRedisClient.keys.mockResolvedValue([]);
      mockRedisClient.status = 'ready';

      const result = await service.keys('nonexistent:*');

      expect(result).toEqual([]);
    });

    it('should return empty array when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.keys('business:*');

      expect(result).toEqual([]);
      expect(mockRedisClient.keys).not.toHaveBeenCalled();
    });
  });

  describe('flushDb()', () => {
    it('should flush database successfully', async () => {
      mockRedisClient.flushdb.mockResolvedValue('OK');
      mockRedisClient.status = 'ready';

      const result = await service.flushDb();

      expect(result).toBe('OK');
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });

    it('should return null when Redis unavailable', async () => {
      mockRedisClient.status = 'close';

      const result = await service.flushDb();

      expect(result).toBeNull();
      expect(mockRedisClient.flushdb).not.toHaveBeenCalled();
    });
  });
});
