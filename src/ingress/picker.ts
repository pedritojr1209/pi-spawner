import { createInterface } from 'node:readline';
import type { DiscoveredAgent } from './discovery.js';

export interface PickerResult {
  agent: DiscoveredAgent;
}

export class AgentPicker {
  static async select(
    agents: DiscoveredAgent[],
    streams: { input: NodeJS.ReadableStream; output: NodeJS.WritableStream }
  ): Promise<PickerResult | null> {
    if (agents.length === 0) {
      return null;
    }

    const rl = createInterface({
      input: streams.input,
      output: streams.output,
    });

    try {
      const answer = await new Promise<string>((resolve) => {
        rl.question(
          'Select an agent:\n' +
          agents.map((a, i) => `  ${i + 1}. ${a.name} (${a.runtime}/${a.surface})${a.description ? ` - ${a.description}` : ''}`).join('\n') +
          '\n\nEnter number (or q to cancel): ',
          resolve
        );
      });

      const trimmed = answer.trim();

      if (trimmed === 'q' || trimmed === '') {
        return null;
      }

      const index = parseInt(trimmed, 10);

      if (Number.isNaN(index) || index < 1 || index > agents.length) {
        return null;
      }

      return { agent: agents[index - 1] };
    } finally {
      rl.close();
    }
  }
}
