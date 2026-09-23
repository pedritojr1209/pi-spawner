import type { RuntimeAdapter } from '../runtimes/runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';

export class PiRuntime implements RuntimeAdapter {
  readonly id = 'pi';

  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    const modelFlag = manifest.model ? ` --model "${manifest.model}"` : '';
    return `pi --task-id "${taskId}"${modelFlag} "${task}"`;
  }
}
