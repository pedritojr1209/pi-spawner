import { describe, it, expect } from 'vitest';
import { getRuntimeDriver, getAvailableRuntimes } from '../../src/runtimes/index.js';

describe('Runtime registry', () => {
  it('returns KiloRuntime for kilo', () => {
    const driver = getRuntimeDriver('kilo');
    expect(driver.id).toBe('kilo');
  });

  it('returns AgyRuntime for agy', () => {
    const driver = getRuntimeDriver('agy');
    expect(driver.id).toBe('agy');
  });

  it('returns OpenCodeRuntime for opencode', () => {
    const driver = getRuntimeDriver('opencode');
    expect(driver.id).toBe('opencode');
  });

  it('returns GenericCliRuntime for generic', () => {
    const driver = getRuntimeDriver('generic');
    expect(driver.id).toBe('generic');
  });

  it('returns GenericCliRuntime for custom alias', () => {
    const driver = getRuntimeDriver('custom');
    expect(driver.id).toBe('generic');
  });

  it('returns PiRuntime for pi', () => {
    const driver = getRuntimeDriver('pi');
    expect(driver.id).toBe('pi');
  });

  it('throws for unknown runtime', () => {
    expect(() => {
      getRuntimeDriver('unknown');
    }).toThrow('Unknown runtime: unknown');
  });

  it('lists available runtimes', () => {
    const runtimes = getAvailableRuntimes();
    expect(runtimes).toContain('kilo');
    expect(runtimes).toContain('agy');
    expect(runtimes).toContain('opencode');
    expect(runtimes).toContain('generic');
    expect(runtimes).toContain('custom');
    expect(runtimes).toContain('pi');
  });
});
