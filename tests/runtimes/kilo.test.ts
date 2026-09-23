import { describe, it, expect } from 'vitest';
import { KiloRuntime } from '../../src/runtimes/kilo.js';
import type { AgentManifest } from '../../src/types/agent.js';

describe('KiloRuntime', () => {
  const runtime = new KiloRuntime();

  it('has id kilo', () => {
    expect(runtime.id).toBe('kilo');
  });

  it('builds command with task and prompt', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'kilo',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'do work');
    expect(cmd).toBe('kilo run "do work"');
  });

  it('escapes double quotes in task', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'kilo',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'say "hello"');
    expect(cmd).toBe('kilo run "say \\"hello\\""');
  });

  it('ignores model flag from manifest', () => {
    const manifest: AgentManifest = {
      name: 'scout',
      runtime: 'kilo',
      surface: 'headless',
      model: 'deepseek',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'do work');
    expect(cmd).toBe('kilo run "do work"');
  });
});
