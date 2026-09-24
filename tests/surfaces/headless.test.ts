import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeadlessDriver } from '../../src/surfaces/headless.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('HeadlessDriver integration', () => {
  let driver: HeadlessDriver;

  beforeEach(() => {
    driver = new HeadlessDriver();
  });

  afterEach(async () => {
    const instances = (driver as any).processes;
    for (const [id, child] of instances.entries()) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  });

  it('is always available', () => {
    expect(driver.isAvailable()).toBe(true);
  });

  it('spawns real process and captures pid', async () => {
    const instance = await driver.launch('cmd /c echo hello');
    expect(instance.id).toMatch(/^headless-/);
    expect(instance.pid).toBeGreaterThan(0);
    expect(instance.exitCode).toBeNull();
  });

  it('completes process and sets exitCode', async () => {
    const instance = await driver.launch('cmd /c exit 0');
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).toBe(0);
    expect(instance.endedAt).toBeInstanceOf(Date);
  });

  it('captures non-zero exitCode', async () => {
    const instance = await driver.launch('cmd /c exit 1');
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).toBe(1);
  });

  it('kills running process', async () => {
    const instance = await driver.launch('cmd /c ping -n 30 127.0.0.1 >nul');
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).toBeNull();
    await driver.kill(instance);
    await new Promise((r) => setTimeout(r, 500));
    expect(instance.exitCode).not.toBeNull();
  });
});
