import type { AgentManifest } from '../types/agent.js';

export class ToolFilter {
  static filter(manifest: AgentManifest): string[] {
    if (!manifest.tools || manifest.tools.length === 0) {
      return [];
    }
    return manifest.tools;
  }
}
