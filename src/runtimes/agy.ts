import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';

export class AgyRuntime implements RuntimeAdapter {
  readonly id = 'agy';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    const taskPart = `"${task.replace(/"/g, '\\"')}"`;
    return `agy ${taskPart}`;
  }
}
