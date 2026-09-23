import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecursionGuard, MaxDepthExceeded, getCurrentDepth, DEPTH_ENV_VAR, DEFAULT_MAX_DEPTH } from '../../src/governance/recursionGuard.js';

describe('recursionGuard', () => {
  beforeEach(() => {
    delete process.env[DEPTH_ENV_VAR];
  });

  it('returns 0 when env var is unset', () => {
    expect(getCurrentDepth()).toBe(0);
  });

  it('returns parsed depth when env var is set', () => {
    process.env[DEPTH_ENV_VAR] = '2';
    expect(getCurrentDepth()).toBe(2);
  });

  it('returns 0 on invalid env value', () => {
    process.env[DEPTH_ENV_VAR] = 'not-a-number';
    expect(getCurrentDepth()).toBe(0);
  });

  it('does not throw when depth is below max', () => {
    const guard = new RecursionGuard({ maxDepth: 3 });
    expect(() => guard.checkDepth(0)).not.toThrow();
    expect(() => guard.checkDepth(2)).not.toThrow();
  });

  it('throws MaxDepthExceeded when depth equals max', () => {
    const guard = new RecursionGuard({ maxDepth: 3 });
    expect(() => guard.checkDepth(3)).toThrow(MaxDepthExceeded);
  });

  it('throws MaxDepthExceeded when depth exceeds max', () => {
    const guard = new RecursionGuard({ maxDepth: 3 });
    expect(() => guard.checkDepth(4)).toThrow(MaxDepthExceeded);
  });

  it('checkCurrent throws when current env depth exceeds max', () => {
    const guard = new RecursionGuard({ maxDepth: 3 });
    process.env[DEPTH_ENV_VAR] = '3';
    expect(() => guard.checkCurrent()).toThrow(MaxDepthExceeded);
  });

  it('uses default max depth of 3', () => {
    const guard = new RecursionGuard();
    expect(() => guard.checkDepth(3)).toThrow(MaxDepthExceeded);
    expect(() => guard.checkDepth(2)).not.toThrow();
  });

  it('detects ancestry cycle when parentTaskId is in history', () => {
    const guard = new RecursionGuard();
    expect(guard.detectCycle('task-1', ['task-0', 'task-1'])).toBe(true);
  });

  it('returns false when parentTaskId is not in history', () => {
    const guard = new RecursionGuard();
    expect(guard.detectCycle('task-2', ['task-0', 'task-1'])).toBe(false);
  });

  it('returns false on empty ancestry history', () => {
    const guard = new RecursionGuard();
    expect(guard.detectCycle('task-1', [])).toBe(false);
  });

  it('builds child env with incremented depth', () => {
    const guard = new RecursionGuard();
    process.env[DEPTH_ENV_VAR] = '2';
    const env = guard.buildChildEnv();
    expect(env[DEPTH_ENV_VAR]).toBe('3');
  });

  it('builds child env starting from 0', () => {
    const guard = new RecursionGuard();
    const env = guard.buildChildEnv();
    expect(env[DEPTH_ENV_VAR]).toBe('1');
  });

  it('allows custom max depth', () => {
    const guard = new RecursionGuard({ maxDepth: 1 });
    expect(() => guard.checkDepth(0)).not.toThrow();
    expect(() => guard.checkDepth(1)).toThrow(MaxDepthExceeded);
  });
});
