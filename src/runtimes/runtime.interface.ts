import type { AgentManifest } from '../types/agent.js';

export interface RuntimeAdapter {
  readonly id: string;
  buildCommand(manifest: AgentManifest, taskId: string, task: string): string;
}
