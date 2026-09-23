import { describe, it, expect } from 'vitest';
import { OpenCodeRuntime } from '../../src/runtimes/opencode.js';
import type { AgentManifest } from '../../src/types/agent.js';

describe('OpenCodeRuntime', () => {
  const runtime = new OpenCodeRuntime();

  it('has id opencode', () => {
    expect(runtime.id).toBe('opencode');
  });

  it('builds command with task and prompt', () => {
    const manifest: AgentManifest = {
      name: 'reviewer',
      runtime: 'opencode',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'review auth module');
    expect(cmd).toBe('opencode run "review auth module"');
  });

  it('escapes double quotes in task', () => {
    const manifest: AgentManifest = {
      name: 'reviewer',
      runtime: 'opencode',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'say "hello"');
    expect(cmd).toBe('opencode run "say \\"hello\\""');
  });

  it('ignores model flag from manifest', () => {
    const manifest: AgentManifest = {
      name: 'reviewer',
      runtime: 'opencode',
      surface: 'headless',
      model: 'deepseek',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'review auth module');
    expect(cmd).toBe('opencode run "review auth module"');
  });
});
