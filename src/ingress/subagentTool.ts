import { AgentDiscovery, DiscoveredAgent } from './discovery.js';
import { Dispatcher } from '../core/dispatcher.js';
import { Mailbox } from '../ipc/mailbox.js';

export interface SubagentToolResult {
  taskId: string;
  summary: string;
  exitCode: number;
  modifiedFiles: string[];
}

export class SubagentTool {
  static async invoke(name: string, task: string, options?: { model?: string }): Promise<SubagentToolResult> {
    const agents = await AgentDiscovery.discover();
    const manifest = agents.find((a) => a.name === name);

    if (!manifest) {
      throw new Error(`Agent not found: ${name}`);
    }

    const dispatchRequest = {
      manifest,
      task,
      cliOptions: options?.model ? { model: options.model } : undefined,
    };

    const result = await Dispatcher.dispatch(dispatchRequest);

    const mailbox = new Mailbox();
    const taskResult = await mailbox.readResult(result.taskId);

    return {
      taskId: result.taskId,
      summary: taskResult.summary,
      exitCode: taskResult.exitCode,
      modifiedFiles: taskResult.modifiedFiles,
    };
  }
}
