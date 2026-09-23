import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    execFile: vi.fn(),
    execFileSync: vi.fn(),
  };
});

vi.mock('./weztermCli.js', async () => {
  const actual = await vi.importActual('./weztermCli.js');
  return {
    ...actual,
    execWezterm: vi.fn(),
    isWeztermAvailable: vi.fn(),
    buildShellCommand: vi.fn(),
    listPaneIds: vi.fn(),
  };
});

import { execWezterm, isWeztermAvailable, buildShellCommand, listPaneIds } from './weztermCli.js';
import { WezTermPaneDriver } from './weztermPane.js';

const mockExecWezterm = execWezterm as unknown as ReturnType<typeof vi.fn>;
const mockIsWeztermAvailable = isWeztermAvailable as unknown as ReturnType<typeof vi.fn>;
const mockBuildShellCommand = buildShellCommand as unknown as ReturnType<typeof vi.fn>;
const mockListPaneIds = listPaneIds as unknown as ReturnType<typeof vi.fn>;

describe('WezTermPaneDriver', () => {
  let driver: WezTermPaneDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecWezterm.mockReset();
    mockIsWeztermAvailable.mockReset();
    mockBuildShellCommand.mockReset();
    mockListPaneIds.mockReset();

    driver = new WezTermPaneDriver();

    mockIsWeztermAvailable.mockReturnValue(true);
    mockExecWezterm.mockResolvedValue('12345\r\n');
    mockBuildShellCommand.mockReturnValue(['cmd', '/c', 'echo hello']);
    mockListPaneIds.mockResolvedValue(['12345']);
  });

  it('isAvailable returns true when wezterm is in PATH', () => {
    expect(driver.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when wezterm is not found', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    expect(driver.isAvailable()).toBe(false);
  });

  it('launch creates a pane with default options', async () => {
    const instance = await driver.launch('echo hello');
    expect(instance.id).toMatch(/^wezterm-pane-/);
    expect(instance.pid).toBe(0);
    expect(instance.exitCode).toBeNull();
    expect(instance.startedAt).toBeInstanceOf(Date);
    expect(instance.endedAt).toBeNull();
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['cli', 'split-pane', '--'])
    );
  });

  it('launch maps horizontal direction to right', async () => {
    await driver.launch('echo hello', { direction: 'horizontal' });
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['--direction', 'right'])
    );
  });

  it('launch maps vertical direction to bottom', async () => {
    await driver.launch('echo hello', { direction: 'vertical' });
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['--direction', 'bottom'])
    );
  });

  it('launch includes size option', async () => {
    await driver.launch('echo hello', { size: 30 });
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['--size', '30'])
    );
  });

  it('launch includes cwd option', async () => {
    await driver.launch('echo hello', { cwd: '/tmp' });
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['--cwd', '/tmp'])
    );
  });

  it('launch trims CRLF from pane ID', async () => {
    mockExecWezterm.mockResolvedValue('  67890\r\n  ');

    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '67890'])
    );
  });

  it('kill calls wezterm cli kill-pane with pane ID', async () => {
    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '12345'])
    );
  });

  it('kill handles already-dead pane gracefully', async () => {
    const instance = await driver.launch('echo hello');
    mockExecWezterm.mockRejectedValue(new Error('pane not found'));

    await expect(driver.kill(instance)).resolves.toBeUndefined();
  });

  it('isAlive returns true when pane exists in list', async () => {
    mockListPaneIds.mockResolvedValue(['12345', '67890']);

    const instance = await driver.launch('echo hello');
    expect(await driver.isAlive(instance)).toBe(true);
  });

  it('isAlive returns false when pane is missing from list', async () => {
    mockListPaneIds.mockResolvedValue(['99999']);

    const instance = await driver.launch('echo hello');
    expect(await driver.isAlive(instance)).toBe(false);
  });

  it('isAlive returns false on error', async () => {
    mockListPaneIds.mockRejectedValue(new Error('list failed'));

    const instance = await driver.launch('echo hello');
    expect(await driver.isAlive(instance)).toBe(false);
  });

  it('close(0) triggers kill-pane', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 0);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '12345'])
    );
  });

  it('close(1) preserves the pane', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 1);
    const killCalls = mockExecWezterm.mock.calls.filter((call: any) =>
      call[0]?.includes?.('kill-pane')
    );
    expect(killCalls.length).toBe(0);
  });
});
