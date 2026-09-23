import { describe, it, expect } from 'vitest';
import { GenericCliRuntime } from '../../src/runtimes/generic.js';
import type { AgentManifest } from '../../src/types/agent.js';

describe('GenericCliRuntime', () => {
  const runtime = new GenericCliRuntime();

  it('has id generic', () => {
    expect(runtime.id).toBe('generic');
  });

  it('replaces {task} in command template', () => {
    const manifest: AgentManifest = {
      name: 'hermes-researcher',
      runtime: 'generic',
      surface: 'headless',
      command_template: 'hermes chat --prompt {task}',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'find data');
    expect(cmd).toBe('hermes chat --prompt "find data"');
  });

  it('replaces {taskId} in command template', () => {
    const manifest: AgentManifest = {
      name: 'hermes-researcher',
      runtime: 'generic',
      surface: 'headless',
      command_template: 'hermes chat --task-id {taskId} --prompt {task}',
    };
    const cmd = runtime.buildCommand(manifest, 'task-abc-123', 'find data');
    expect(cmd).toBe('hermes chat --task-id task-abc-123 --prompt "find data"');
  });

  it('escapes double quotes in task replacement', () => {
    const manifest: AgentManifest = {
      name: 'hermes-researcher',
      runtime: 'generic',
      surface: 'headless',
      command_template: 'hermes chat --prompt {task}',
    };
    const cmd = runtime.buildCommand(manifest, 'task-123', 'say "hello"');
    expect(cmd).toBe('hermes chat --prompt "say \\"hello\\""');
  });

  it('throws when command_template is missing', () => {
    const manifest: AgentManifest = {
      name: 'hermes-researcher',
      runtime: 'generic',
      surface: 'headless',
    };
    expect(() => {
      runtime.buildCommand(manifest, 'task-123', 'find data');
    }).toThrow('GenericCliRuntime requires command_template in manifest');
  });
});
