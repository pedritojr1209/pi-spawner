import readline from 'node:readline';
import { AgentDiscovery } from './discovery.js';
import { SlashCommandParser, type ParsedCommand, type ParsedAgentCommand, type ParsedPickerCommand } from './slashCommand.js';
import { AgentPicker, type PickerResult } from './picker.js';
import { SubagentTool, type SubagentToolResult } from './subagentTool.js';
import { Dispatcher } from '../core/dispatcher.js';

export interface SlashCommandResult {
  taskId: string;
  agentName: string;
}

export class Ingress {
  static async handleSlashCommand(input: string): Promise<SlashCommandResult | null> {
    const parsed = SlashCommandParser.parse(input);

    if (!parsed) {
      return null;
    }

    if (parsed.type === 'direct') {
      return this.handleDirectCommand(parsed);
    }

    if (parsed.type === 'picker') {
      return this.handlePickerCommand();
    }

    return null;
  }

  private static async handleDirectCommand(command: ParsedAgentCommand): Promise<SlashCommandResult> {
    const agents = await AgentDiscovery.discover();
    const manifest = agents.find((a) => a.name === command.agentName);

    if (!manifest) {
      throw new Error(`Agent not found: ${command.agentName}`);
    }

    const result = await Dispatcher.dispatch({
      manifest: manifest as any,
      task: command.task,
      cliOptions: command.cliOptions,
    });

    return {
      taskId: result.taskId,
      agentName: command.agentName,
    };
  }

  private static async handlePickerCommand(): Promise<SlashCommandResult | null> {
    const agents = await AgentDiscovery.discover();

    const pickerResult = await AgentPicker.select(agents, {
      input: process.stdin,
      output: process.stdout,
    });

    if (!pickerResult) {
      return null;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const task = await new Promise<string>((resolve) => {
        rl.question('Enter task: ', resolve);
      });

      const trimmed = task.trim();
      if (!trimmed) {
        return null;
      }

      const result = await Dispatcher.dispatch({
        manifest: pickerResult.agent as any,
        task: trimmed,
      });

      return {
        taskId: result.taskId,
        agentName: pickerResult.agent.name,
      };
    } finally {
      rl.close();
    }
  }

  static async handleSubagentTool(name: string, task: string): Promise<SubagentToolResult> {
    return SubagentTool.invoke(name, task);
  }
}
