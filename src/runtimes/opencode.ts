import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';

export class OpenCodeRuntime implements RuntimeAdapter {
  readonly id = 'opencode';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    const taskPart = `"${task.replace(/"/g, '\\"')}"`;
    return `opencode run ${taskPart}`;
  }
}
