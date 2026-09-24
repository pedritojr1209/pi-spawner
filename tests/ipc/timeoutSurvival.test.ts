import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeoutWatchdog, TaskTimeout } from '../../src/governance/timeoutWatchdog.js';
import { HeadlessDriver } from '../../src/surfaces/headless.js';

describe('Timeout survival integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TimeoutWatchdog kills task and throws on expiry', async () => {
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

  it('TimeoutWatchdog resolves when task completes before timeout', async () => {
    const kill = vi.fn();
    const watchdog = new TimeoutWatchdog({ timeoutMs: 5000, kill });

    const result = await watchdog.wrap(async () => {
      return 42;
    });

    expect(result).toBe(42);
    expect(kill).not.toHaveBeenCalled();
  });

  it('HeadlessDriver has 5-minute timeout built in', async () => {
    const driver = new HeadlessDriver();
    const instance = await driver.launch('cmd /c echo hello');
    expect(instance.id).toMatch(/^headless-/);
    expect(instance.pid).toBeGreaterThan(0);
  });
});
