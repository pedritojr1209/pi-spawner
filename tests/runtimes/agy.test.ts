import { describe, it, expect } from 'vitest';
import { AgyRuntime } from '../../src/runtimes/agy.js';
import type { AgentManifest } from '../../src/types/agent.js';

describe('AgyRuntime', () => {
  const runtime = new AgyRuntime();

  it('has id agy', () => {
    expect(runtime.id).toBe('agy');
  });

  it('builds command with task', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'find auth routes');
    expect(cmd).toBe('agy "find auth routes"');
  });

  it('escapes double quotes in task', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'say "hello"');
    expect(cmd).toBe('agy "say \\"hello\\""');
  });

  it('ignores model flag from manifest', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'headless',
      model: 'deepseek',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'find auth routes');
    expect(cmd).toBe('agy "find auth routes"');
  });
});
