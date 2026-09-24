import { HeadlessDriver } from '../surfaces/headless.js';
import { getRuntimeDriver } from '../runtimes/index.js';
import { getSurfaceDriver } from '../surfaces/index.js';
import { Mailbox } from '../ipc/mailbox.js';
import { projectContext } from '../ipc/contextProjection.js';
import { MaxRecursionDepthExceeded } from '../governance/index.js';
import type { AgentManifest } from '../types/agent.js';
import type { TaskInput } from '../types/envelope.js';
import type { SurfaceDriver } from '../surfaces/surface.interface.js';

export { MaxRecursionDepthExceeded };

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
  private static getDepth(): number {
    return parseInt(process.env.PI_AGENT_DEPTH || '0', 10);
  }

  static async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const { manifest, task, cliOptions, parentSessionModel } = request;

    const depth = this.getDepth();
    if (depth >= 2) {
      throw new MaxRecursionDepthExceeded();
    }

    const effectiveModel = cliOptions?.model || manifest.model || parentSessionModel || '';

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const runtime = getRuntimeDriver(manifest.runtime);

    let surface: SurfaceDriver;
    try {
      surface = getSurfaceDriver(manifest.surface);
    } catch {
      surface = new HeadlessDriver();
    }
    if (!surface.isAvailable()) {
      surface = new HeadlessDriver();
    }

    const command = runtime.buildCommand(manifest, taskId, task);

    const mailbox = new Mailbox();
    const input: TaskInput = {
      taskId,
      parentTaskId: undefined,
      task: projectContext(task, undefined, 'isolated'),
      contextMode: 'isolated',
      context: undefined,
      tools: manifest.tools,
      model: effectiveModel,
      cwd: process.cwd(),
      depth: depth + 1,
    };

    mailbox.writeInput(taskId, input);

    process.env.PI_AGENT_DEPTH = String(depth + 1);

    const instance = await surface.launch(command, { cwd: process.cwd() });

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
