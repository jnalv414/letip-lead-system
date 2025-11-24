/**
 * BullMQ Retry Strategy Configuration
 *
 * Defines retry policies for different job types and error scenarios.
 * Includes exponential backoff, circuit breakers, and error-specific handling.
 */

import { Job } from 'bullmq';

/**
 * Error categories for retry strategy selection.
 */
export enum ErrorCategory {
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Categorize error based on message and type.
 *
 * @param error - Error object from failed job
 * @returns Error category for retry strategy selection
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (message.includes('rate limit') || message.includes('quota exceeded')) {
    return ErrorCategory.RATE_LIMIT;
  }

  if (
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout') ||
    message.includes('network')
  ) {
    return ErrorCategory.NETWORK;
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }

  if (message.includes('timeout')) {
    return ErrorCategory.TIMEOUT;
  }

  if (message.includes('api error') || message.includes('status code')) {
    return ErrorCategory.API_ERROR;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Calculate retry delay based on error category and attempt number.
 *
 * @param job - BullMQ job that failed
 * @param error - Error that caused failure
 * @returns Delay in milliseconds before next retry
 *
 * @example
 * // Network error on attempt 1 → 2000ms delay
 * const delay = getRetryDelay(job, new Error('ECONNREFUSED'));
 *
 * @example
 * // Rate limit error → 60000ms delay (1 minute)
 * const delay = getRetryDelay(job, new Error('Rate limit exceeded'));
 */
export function getRetryDelay(job: Job, error: Error): number {
  const category = categorizeError(error);
  const attemptsMade = job.attemptsMade || 0;

  switch (category) {
    case ErrorCategory.RATE_LIMIT:
      // Long delay for rate limits (1 hour)
      return 3600000;

    case ErrorCategory.NETWORK:
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      return Math.min(2000 * Math.pow(2, attemptsMade), 32000);

    case ErrorCategory.VALIDATION:
      // Don't retry validation errors (permanent failure)
      return 0;

    case ErrorCategory.TIMEOUT:
      // Linear backoff: 5s, 10s, 15s
      return 5000 * (attemptsMade + 1);

    case ErrorCategory.API_ERROR:
      // Moderate exponential backoff: 3s, 6s, 12s
      return Math.min(3000 * Math.pow(2, attemptsMade), 30000);

    case ErrorCategory.UNKNOWN:
    default:
      // Standard exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptsMade), 8000);
  }
}

/**
 * Determine if a job should be retried based on error type.
 *
 * @param job - BullMQ job that failed
 * @param error - Error that caused failure
 * @returns true if job should be retried, false to mark as permanently failed
 *
 * @example
 * // Validation errors should not be retried
 * shouldRetry(job, new Error('Invalid email format')); // false
 *
 * @example
 * // Network errors should be retried
 * shouldRetry(job, new Error('ECONNREFUSED')); // true
 */
export function shouldRetry(job: Job, error: Error): boolean {
  const category = categorizeError(error);
  const attemptsMade = job.attemptsMade || 0;
  const maxAttempts = job.opts.attempts || 3;

  // Don't retry if max attempts reached
  if (attemptsMade >= maxAttempts) {
    return false;
  }

  // Never retry validation errors
  if (category === ErrorCategory.VALIDATION) {
    return false;
  }

  // Always retry network and timeout errors
  if (
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.TIMEOUT
  ) {
    return true;
  }

  // Retry rate limits once after long delay
  if (category === ErrorCategory.RATE_LIMIT) {
    return attemptsMade < 1;
  }

  // Retry API errors up to max attempts
  if (category === ErrorCategory.API_ERROR) {
    return attemptsMade < maxAttempts;
  }

  // Default: retry unknown errors
  return true;
}

/**
 * Circuit breaker state for external API calls.
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
  ) {}

  /**
   * Record a successful API call (resets circuit breaker).
   */
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  /**
   * Record a failed API call (increments failure counter).
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Check if circuit breaker allows request.
   *
   * @returns true if request should proceed, false if circuit is open
   */
  allowRequest(): boolean {
    // Circuit is closed, allow request
    if (this.state === 'CLOSED') {
      return true;
    }

    // Circuit is open, check if timeout has passed
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure > this.timeout) {
        // Try half-open state
        this.state = 'HALF_OPEN';
        return true;
      }

      return false;
    }

    // Half-open state, allow single request
    return true;
  }

  /**
   * Get current circuit breaker state.
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  /**
   * Reset circuit breaker to initial state.
   */
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Global circuit breakers for external services.
 */
export const CIRCUIT_BREAKERS = {
  hunter: new CircuitBreaker(5, 60000), // Open after 5 failures, 1 min timeout
  abstract: new CircuitBreaker(5, 60000),
  apify: new CircuitBreaker(3, 120000), // Open after 3 failures, 2 min timeout
};
