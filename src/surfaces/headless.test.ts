import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeadlessDriver } from './headless.js';

describe('HeadlessDriver', () => {
  let driver: HeadlessDriver;

  beforeEach(() => {
    driver = new HeadlessDriver();
  });

  it('is always available', () => {
    expect(driver.isAvailable()).toBe(true);
  });

  it('returns instance with id and pid', async () => {
    const instance = await driver.launch('echo hello');
    expect(instance.id).toMatch(/^headless-/);
    expect(instance.pid).toBeGreaterThan(0);
    expect(instance.exitCode).toBeNull();
    expect(instance.startedAt).toBeInstanceOf(Date);
    expect(instance.endedAt).toBeNull();
  });

  it('completes and sets exitCode', async () => {
    const instance = await driver.launch('cmd /c exit 0');
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).toBe(0);
    expect(instance.endedAt).toBeInstanceOf(Date);
  });

  it('returns non-zero exitCode on failure', async () => {
    const instance = await driver.launch('cmd /c exit 1');
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).toBe(1);
  });

  it('kills running process', async () => {
    const instance = await driver.launch('cmd /c ping -n 30 127.0.0.1 >nul');
    await new Promise((r) => setTimeout(r, 500));
    await driver.kill(instance);
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).not.toBeNull();
  });
});
