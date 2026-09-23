import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';
import { escapePrompt } from './shared.js';

export class OpenCodeRuntime implements RuntimeAdapter {
  readonly id = 'opencode';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `opencode run ${escapePrompt(task)}`;
  }
}
