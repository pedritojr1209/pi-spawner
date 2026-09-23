import { describe, it, expect, vi } from 'vitest';
import { ConcurrencyLimiter, ConcurrencyLimitExceeded } from '../../src/governance/concurrencyLimiter.js';

describe('concurrencyLimiter', () => {
  it('starts with zero active count', () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 3 });
    expect(limiter.getActiveCount()).toBe(0);
  });

  it('acquires a slot and increments count', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 3 });
    await limiter.acquire();
    expect(limiter.getActiveCount()).toBe(1);
    limiter.release();
  });

  it('releases a slot and decrements count', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 3 });
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.getActiveCount()).toBe(2);
    limiter.release();
    expect(limiter.getActiveCount()).toBe(1);
    limiter.release();
  });

  it('rejects beyond limit', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 1 });
    await limiter.acquire();
    const promise = limiter.acquire();
    expect(limiter.getActiveCount()).toBe(1);
    limiter.release();
    await promise;
    expect(limiter.getActiveCount()).toBe(1);
    limiter.release();
  });

  it('tryAcquire returns true when slot available', () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 3 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.getActiveCount()).toBe(1);
  });

  it('tryAcquire returns false when limit reached', () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 1 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('uses default max concurrency of 3', () => {
    const limiter = new ConcurrencyLimiter();
    expect(limiter.getActiveCount()).toBe(0);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('queues waiting acquirers and releases in order', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 1 });
    await limiter.acquire();

    const order: number[] = [];
    const p1 = limiter.acquire().then(() => order.push(1));
    const p2 = limiter.acquire().then(() => order.push(2));

    limiter.release();
    limiter.release();

    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
  });

  it('handles release when no active tasks', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrency: 3 });
    limiter.release();
    expect(limiter.getActiveCount()).toBe(0);
  });
});
