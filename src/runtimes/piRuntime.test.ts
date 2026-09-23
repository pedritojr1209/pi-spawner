import { describe, it, expect } from 'vitest';
import { PiRuntime } from './piRuntime.js';
import type { AgentManifest } from '../types/agent.js';

describe('PiRuntime', () => {
  const runtime = new PiRuntime();

  it('has id pi', () => {
    expect(runtime.id).toBe('pi');
  });

  it('builds command with taskId and prompt', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'do work');
    expect(cmd).toBe('pi --task-id "task-123" "do work"');
  });

  it('includes model when defined in manifest', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
      model: 'deepseek',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'do work');
    expect(cmd).toBe('pi --task-id "task-123" --model "deepseek" "do work"');
  });
});
