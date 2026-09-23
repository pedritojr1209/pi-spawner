import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';
import { escapePrompt } from './shared.js';

export class AgyRuntime implements RuntimeAdapter {
  readonly id = 'agy';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `agy ${escapePrompt(task)}`;
  }
}
