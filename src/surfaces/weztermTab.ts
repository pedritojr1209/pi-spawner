import type { SurfaceDriver, SurfaceInstance, LaunchOptions } from './surface.interface.js';
import { buildShellCommand, execWezterm, isWeztermAvailable, listPaneIds } from './weztermCli.js';

export class WezTermTabDriver implements SurfaceDriver {
  readonly id = 'wezterm-tab';

  private tabs = new Map<string, { paneId: string }>();

  isAvailable(): boolean {
    return isWeztermAvailable();
  }

  async launch(command: string, options: LaunchOptions = {}): Promise<SurfaceInstance> {
    const taskId = `wezterm-tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const args = ['cli', 'spawn', '--new-window=false'];

    if (options.cwd) {
      args.push('--cwd', options.cwd);
    }

    args.push('--', ...buildShellCommand(command, options.args));

    const stdout = await execWezterm(args);
    const paneId = stdout.trim();

    this.tabs.set(taskId, { paneId });

    return {
      id: taskId,
      pid: 0,
      exitCode: null,
      startedAt: new Date(),
      endedAt: null,
    };
  }

  async kill(instance: SurfaceInstance): Promise<void> {
    const entry = this.tabs.get(instance.id);
    if (entry?.paneId) {
      try {
        await execWezterm(['cli', 'kill-pane', '--pane-id', entry.paneId]);
      } catch {
        // already dead
      }
    }
    this.tabs.delete(instance.id);
  }

  async close(instance: SurfaceInstance, exitCode: number): Promise<void> {
    if (exitCode === 0) {
      await this.kill(instance);
    }
  }

  async isAlive(instance: SurfaceInstance): Promise<boolean> {
    const entry = this.tabs.get(instance.id);
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
