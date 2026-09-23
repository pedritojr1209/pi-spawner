import fs from 'node:fs';
import path from 'node:path';
import { PathGuard, SecurityError } from '../interceptors/pathGuard.js';
import { HeadlessDriver } from '../surfaces/headless.js';
import { PiRuntime } from '../runtimes/piRuntime.js';
import type { AgentManifest } from '../types/agent.js';
import type { TaskInputEnvelope } from '../types/envelope.js';

export class MaxRecursionDepthExceeded extends Error {
  constructor(message = 'Maximum recursion depth exceeded') {
    super(message);
    this.name = 'MaxRecursionDepthExceeded';
  }
}

export interface DispatchRequest {
  manifest: AgentManifest;
  task: string;
  cliOptions?: {
    model?: string;
  };
  parentSessionModel?: string;
}

export interface DispatchResult {
  taskId: string;
  surfaceInstance: {
    id: string;
    pid: number;
    exitCode: number | null;
  };
}

export class Dispatcher {
  private static driver = new HeadlessDriver();
  private static runtime = new PiRuntime();

  private static getDepth(): number {
    return parseInt(process.env.PI_AGENT_DEPTH || '0', 10);
  }

  static async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const { manifest, task, cliOptions, parentSessionModel } = request;

    const depth = this.getDepth();
    if (depth > 2) {
      throw new MaxRecursionDepthExceeded();
    }

    const effectiveModel = cliOptions?.model || manifest.model || parentSessionModel || '';

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const handoffDir = path.join(process.cwd(), '.pi', 'handoffs', taskId);

    PathGuard.validate(handoffDir);

    fs.mkdirSync(handoffDir, { recursive: true });

    const inputEnvelope: TaskInputEnvelope = {
      taskId,
      agentName: manifest.name,
      prompt: task,
      model: effectiveModel,
      depth: depth + 1,
      allowedTools: manifest.tools ?? [],
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(handoffDir, 'input.json'),
      JSON.stringify(inputEnvelope, null, 2)
    );

    process.env.PI_AGENT_DEPTH = String(depth + 1);

    const command = this.runtime.buildCommand(manifest, taskId, task);

    const instance = await this.driver.launch(command, { cwd: process.cwd() });

    return {
      taskId,
      surfaceInstance: {
        id: instance.id,
        pid: instance.pid,
        exitCode: instance.exitCode,
      },
    };
  }
}
