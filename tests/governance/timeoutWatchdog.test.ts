import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeoutWatchdog, TaskTimeout } from '../../src/governance/timeoutWatchdog.js';

describe('timeoutWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when task completes before timeout', async () => {
    const kill = vi.fn();
    const watchdog = new TimeoutWatchdog({ timeoutMs: 5000, kill });

    const result = await watchdog.wrap(async () => {
      return 42;
    });

    expect(result).toBe(42);
    expect(kill).not.toHaveBeenCalled();
  });

  it('calls kill and throws TaskTimeout on expiry', async () => {
    const kill = vi.fn();
    const watchdog = new TimeoutWatchdog({ timeoutMs: 100, kill });

    const promise = watchdog.wrap(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return 'done';
    });

    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toThrow(TaskTimeout);
    expect(kill).toHaveBeenCalled();
  });

  it('clears timer on natural completion', async () => {
    const kill = vi.fn();
    const watchdog = new TimeoutWatchdog({ timeoutMs: 5000, kill });

    const promise = watchdog.wrap(async () => 'done');
    const result = await promise;

    expect(result).toBe('done');
    expect(kill).not.toHaveBeenCalled();
  });

  it('clears timer on error', async () => {
    const kill = vi.fn();
    const watchdog = new TimeoutWatchdog({ timeoutMs: 5000, kill });

    const promise = watchdog.wrap(async () => {
      throw new Error('task error');
    });

    await expect(promise).rejects.toThrow('task error');
    expect(kill).not.toHaveBeenCalled();
  });

  it('handles async kill callback', async () => {
    const kill = vi.fn().mockResolvedValue(undefined);
    const watchdog = new TimeoutWatchdog({ timeoutMs: 100, kill });

    const promise = watchdog.wrap(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return 'done';
    });

    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toThrow(TaskTimeout);
    expect(kill).toHaveBeenCalled();
  });
});
