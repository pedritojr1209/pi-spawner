import { spawn, type ChildProcess } from 'node:child_process';
import type { SurfaceDriver, SurfaceInstance, LaunchOptions } from '../surfaces/surface.interface.js';

const HEADLESS_TIMEOUT_MS = 5 * 60 * 1000;

export class HeadlessDriver implements SurfaceDriver {
  readonly id = 'headless';

  private processes: Map<string, ChildProcess> = new Map();

  isAvailable(): boolean {
    return true;
  }

  async launch(command: string, options: LaunchOptions = {}): Promise<SurfaceInstance> {
    const taskId = `headless-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const shell = options.args ? [command, ...options.args] : [command];

    const child = spawn('cmd', ['/c', ...shell], {
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...options.env },
      detached: true,
      stdio: 'ignore',
    });

    this.processes.set(taskId, child);

    const instance: SurfaceInstance = {
      id: taskId,
      pid: child.pid ?? 0,
      exitCode: null,
      startedAt: new Date(),
      endedAt: null,
    };

    const timeoutHandle = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      instance.exitCode = -1;
      instance.endedAt = new Date();
      this.processes.delete(taskId);
    }, HEADLESS_TIMEOUT_MS);

    child.on('exit', (code) => {
      clearTimeout(timeoutHandle);
      instance.exitCode = code ?? 0;
      instance.endedAt = new Date();
      this.processes.delete(taskId);
    });

    child.on('error', () => {
      clearTimeout(timeoutHandle);
      instance.exitCode = -1;
      instance.endedAt = new Date();
      this.processes.delete(taskId);
    });

    return instance;
  }

  async kill(instance: SurfaceInstance): Promise<void> {
    const child = this.processes.get(instance.id);
    if (child?.pid) {
      try {
        child.kill('SIGTERM');
      } catch {
        // already dead
      }
    }
    this.processes.delete(instance.id);
  }
}
