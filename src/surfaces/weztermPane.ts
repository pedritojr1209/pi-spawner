import { execFile, execFileSync } from 'node:child_process';
import type { SurfaceDriver, SurfaceInstance, LaunchOptions } from './surface.interface.js';

function execWezterm(args: string[]): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile('wezterm', args, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout });
      }
    });
  });
}

export class WezTermPaneDriver implements SurfaceDriver {
  readonly id = 'wezterm-pane';

  private panes = new Map<string, { paneId: string }>();

  isAvailable(): boolean {
    try {
      execFileSync('wezterm', ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async launch(command: string, options: LaunchOptions = {}): Promise<SurfaceInstance> {
    const taskId = `wezterm-pane-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const args = ['cli', 'split-pane'];

    if (options.direction === 'horizontal') {
      args.push('--direction', 'right');
    } else if (options.direction === 'vertical') {
      args.push('--direction', 'bottom');
    }

    if (typeof options.size === 'number') {
      args.push('--size', String(options.size));
    }

    if (options.cwd) {
      args.push('--cwd', options.cwd);
    }

    let shellCommand = command;
    if (options.args && options.args.length > 0) {
      shellCommand = `${command} ${options.args.join(' ')}`;
    }

    const shellArgs = process.platform === 'win32'
      ? ['cmd', '/c', shellCommand]
      : ['bash', '-c', shellCommand];
    args.push('--', ...shellArgs);

    const { stdout } = await execWezterm(args);
    const paneId = stdout.trim();

    this.panes.set(taskId, { paneId });

    return {
      id: taskId,
      pid: 0,
      exitCode: null,
      startedAt: new Date(),
      endedAt: null,
    };
  }

  async kill(instance: SurfaceInstance): Promise<void> {
    const entry = this.panes.get(instance.id);
    if (entry?.paneId) {
      try {
        await execWezterm(['cli', 'kill-pane', '--pane-id', entry.paneId]);
      } catch {
        // already dead
      }
    }
    this.panes.delete(instance.id);
  }

  async isAlive(instance: SurfaceInstance): Promise<boolean> {
    try {
      const { stdout } = await execWezterm(['cli', 'list', '--format', 'json']);
      const entry = this.panes.get(instance.id);
      if (!entry?.paneId) return false;
      const panes = JSON.parse(stdout);
      return panes.some((p: { pane_id: string }) => String(p.pane_id) === entry.paneId);
    } catch {
      return false;
    }
  }
}
