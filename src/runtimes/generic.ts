import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';

export class GenericCliRuntime implements RuntimeAdapter {
  readonly id = 'generic';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    if (!manifest.command_template) {
      throw new Error('GenericCliRuntime requires command_template in manifest');
    }

    const escapedTask = task.replace(/"/g, '\\"');
    const command = manifest.command_template
      .replace(/\{taskId\}/g, taskId)
      .replace(/\{task\}/g, `"${escapedTask}"`);

    return command;
  }
}
