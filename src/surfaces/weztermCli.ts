import { execFile, execFileSync } from 'node:child_process';

export function execWezterm(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('wezterm', args, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export function isWeztermAvailable(): boolean {
  try {
    execFileSync('wezterm', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function buildShellCommand(command: string, args?: string[]): string[] {
  const shellCommand = args && args.length > 0
    ? `${command} ${args.join(' ')}`
    : command;

  return process.platform === 'win32'
    ? ['cmd', '/c', shellCommand]
    : ['bash', '-c', shellCommand];
}

export async function listPaneIds(): Promise<string[]> {
  const stdout = await execWezterm(['cli', 'list', '--format', 'json']);
  const panes = JSON.parse(stdout);
  return panes.map((p: { pane_id: string }) => String(p.pane_id));
}
