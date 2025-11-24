import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BaseWorker } from './base-worker';
import { ScrapingWorker } from './scraping.worker';
import { EnrichmentWorker } from './enrichment.worker';
import { OutreachWorker } from './outreach.worker';

/**
 * Worker Manager Service
 *
 * Manages all BullMQ workers lifecycle:
 * - Registration of workers
 * - Graceful startup and shutdown
 * - Worker health monitoring
 *
 * Workers are registered during module initialization and automatically
 * started. They are gracefully closed on module destruction.
 *
 * @example
 * // Register a worker
 * workerManager.registerWorker(scrapingWorker);
 *
 * @example
 * // Get all workers
 * const workers = workerManager.getWorkers();
 */
@Injectable()
export class WorkerManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerManagerService.name);
  private readonly workers: Map<string, BaseWorker> = new Map();

  constructor(
    private readonly scrapingWorker: ScrapingWorker,
    private readonly enrichmentWorker: EnrichmentWorker,
    private readonly outreachWorker: OutreachWorker,
  ) {}

  /**
   * Module initialization - register all workers and log status.
   */
  async onModuleInit(): Promise<void> {
    // Register all workers
    this.registerWorker('scraping-jobs', this.scrapingWorker);
    this.registerWorker('enrichment-jobs', this.enrichmentWorker);
    this.registerWorker('outreach-jobs', this.outreachWorker);

    this.logger.log(`Worker Manager initialized with ${this.workers.size} workers`);
    this.logger.log('Registered workers: ' + Array.from(this.workers.keys()).join(', '));
  }

  /**
   * Module destruction - gracefully close all workers.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down all workers...');

    const closePromises = Array.from(this.workers.values()).map((worker) =>
      worker.close().catch((error) => {
        this.logger.error(`Failed to close worker: ${error.message}`, error.stack);
      }),
    );

    await Promise.all(closePromises);
    this.logger.log('All workers shut down successfully');
  }

  /**
   * Register a worker for management.
   *
   * @param queueName - Queue name (used as worker identifier)
   * @param worker - Worker instance
   */
  registerWorker(queueName: string, worker: BaseWorker): void {
    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker for queue ${queueName} already registered, replacing...`);
    }

    this.workers.set(queueName, worker);
    this.logger.log(`Registered worker for queue: ${queueName}`);
  }

  /**
   * Get a specific worker by queue name.
   *
   * @param queueName - Queue name
   * @returns Worker instance or undefined if not found
   */
  getWorker(queueName: string): BaseWorker | undefined {
    return this.workers.get(queueName);
  }

  /**
   * Get all registered workers.
   *
   * @returns Map of queue names to worker instances
   */
  getWorkers(): Map<string, BaseWorker> {
    return this.workers;
  }

  /**
   * Pause a specific worker.
   *
   * @param queueName - Queue name
   */
  async pauseWorker(queueName: string): Promise<void> {
    const worker = this.workers.get(queueName);
    if (!worker) {
      throw new Error(`Worker for queue ${queueName} not found`);
    }

    await worker.pause();
    this.logger.log(`Paused worker for queue: ${queueName}`);
  }

  /**
   * Resume a specific worker.
   *
   * @param queueName - Queue name
   */
  async resumeWorker(queueName: string): Promise<void> {
    const worker = this.workers.get(queueName);
    if (!worker) {
      throw new Error(`Worker for queue ${queueName} not found`);
    }

    await worker.resume();
    this.logger.log(`Resumed worker for queue: ${queueName}`);
  }

  /**
   * Pause all workers.
   */
  async pauseAll(): Promise<void> {
    this.logger.log('Pausing all workers...');

    const pausePromises = Array.from(this.workers.values()).map((worker) =>
      worker.pause().catch((error) => {
        this.logger.error(`Failed to pause worker: ${error.message}`, error.stack);
      }),
    );

    await Promise.all(pausePromises);
    this.logger.log('All workers paused');
  }

  /**
   * Resume all workers.
   */
  async resumeAll(): Promise<void> {
    this.logger.log('Resuming all workers...');

    const resumePromises = Array.from(this.workers.values()).map((worker) =>
      worker.resume().catch((error) => {
        this.logger.error(`Failed to resume worker: ${error.message}`, error.stack);
      }),
    );

    await Promise.all(resumePromises);
    this.logger.log('All workers resumed');
  }

  /**
   * Get health status of all workers.
   *
   * @returns Object with worker health information
   */
  getHealthStatus(): Record<string, { registered: boolean; queueName: string }> {
    const status: Record<string, { registered: boolean; queueName: string }> = {};

    this.workers.forEach((worker, queueName) => {
      status[queueName] = {
        registered: true,
        queueName,
      };
    });

    return status;
  }
}
