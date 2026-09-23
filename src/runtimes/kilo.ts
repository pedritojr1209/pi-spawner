import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';
import { escapePrompt } from './shared.js';

export class KiloRuntime implements RuntimeAdapter {
  readonly id = 'kilo';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `kilo run ${escapePrompt(task)}`;
  }
}
