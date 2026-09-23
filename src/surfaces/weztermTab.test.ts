import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    execFile: vi.fn(),
    execFileSync: vi.fn(),
  };
});

import { execFile, execFileSync } from 'node:child_process';
import { WezTermTabDriver } from './weztermTab.js';

const mockExecFile = execFile as unknown as ReturnType<typeof vi.fn>;
const mockExecFileSync = execFileSync as unknown as ReturnType<typeof vi.fn>;

describe('WezTermTabDriver', () => {
  let driver: WezTermTabDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFile.mockReset();
    mockExecFileSync.mockReset();
    driver = new WezTermTabDriver();

    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '', '');
    });

    mockExecFileSync.mockReturnValue(Buffer.from('wezterm 20240101'));
  });

  it('isAvailable returns true when wezterm is in PATH', () => {
    expect(driver.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when wezterm is not found', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(driver.isAvailable()).toBe(false);
  });

  it('launch spawns a tab with default options', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '12345\r\n', '');
    });

    const instance = await driver.launch('echo hello');
    expect(instance.id).toMatch(/^wezterm-tab-/);
    expect(instance.pid).toBe(0);
    expect(instance.exitCode).toBeNull();
    expect(instance.startedAt).toBeInstanceOf(Date);
    expect(instance.endedAt).toBeNull();
    expect(mockExecFile).toHaveBeenCalledWith(
      'wezterm',
      expect.arrayContaining(['cli', 'spawn', '--new-window=false', '--']),
      { encoding: 'utf8' },
      expect.any(Function)
    );
  });

  it('launch includes cwd option', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '12345\r\n', '');
    });

    await driver.launch('echo hello', { cwd: '/tmp' });
    expect(mockExecFile).toHaveBeenCalledWith(
      'wezterm',
      expect.arrayContaining(['--cwd', '/tmp']),
      expect.anything(),
      expect.any(Function)
    );
  });

  it('launch trims CRLF from pane ID', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '  67890\r\n  ', '');
    });

    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecFile).toHaveBeenCalledWith(
      'wezterm',
      expect.arrayContaining(['kill-pane', '--pane-id', '67890']),
      expect.anything(),
      expect.any(Function)
    );
  });

  it('kill calls wezterm cli kill-pane with pane ID', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '12345\r\n', '');
    });

    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecFile).toHaveBeenCalledWith(
      'wezterm',
      expect.arrayContaining(['kill-pane', '--pane-id', '12345']),
      expect.anything(),
      expect.any(Function)
    );
  });

  it('kill handles already-dead pane gracefully', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '12345\r\n', '');
    });

    const instance = await driver.launch('echo hello');
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(new Error('pane not found'), '', '');
    });

    await expect(driver.kill(instance)).resolves.toBeUndefined();
  });

  it('launch passes extra args', async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
      callback(null, '12345\r\n', '');
    });

    await driver.launch('echo', { args: ['hello', 'world'] });
    expect(mockExecFile).toHaveBeenCalledWith(
      'wezterm',
      expect.arrayContaining(['--', 'cmd', '/c', 'echo hello world']),
      expect.anything(),
      expect.any(Function)
    );
  });
});
