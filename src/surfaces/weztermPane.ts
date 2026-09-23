import type { SurfaceDriver, SurfaceInstance, LaunchOptions } from './surface.interface.js';
import { buildShellCommand, execWezterm, isWeztermAvailable, listPaneIds } from './weztermCli.js';

export class WezTermPaneDriver implements SurfaceDriver {
  readonly id = 'wezterm-pane';

  private panes = new Map<string, { paneId: string }>();

  isAvailable(): boolean {
    return isWeztermAvailable();
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

    args.push('--', ...buildShellCommand(command, options.args));

    const stdout = await execWezterm(args);
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

  async close(instance: SurfaceInstance, exitCode: number): Promise<void> {
    if (exitCode === 0) {
      await this.kill(instance);
    }
  }

  async isAlive(instance: SurfaceInstance): Promise<boolean> {
    const entry = this.panes.get(instance.id);
    if (!entry?.paneId) {
      return false;
    }

    try {
      const paneIds = await listPaneIds();
      return paneIds.includes(entry.paneId);
    } catch {
      return false;
    }
  }
}
