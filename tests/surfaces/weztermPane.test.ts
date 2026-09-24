import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WezTermPaneDriver } from '../../src/surfaces/weztermPane.js';

vi.mock('../../src/surfaces/weztermCli.js', async () => {
  const actual = await vi.importActual('../../src/surfaces/weztermCli.js');
  return {
    ...actual,
    execWezterm: vi.fn(),
    isWeztermAvailable: vi.fn(),
    buildShellCommand: vi.fn().mockReturnValue(['cmd', '/c', 'echo hello']),
    listPaneIds: vi.fn(),
  };
});

import { execWezterm, isWeztermAvailable, buildShellCommand, listPaneIds } from '../../src/surfaces/weztermCli.js';

const mockExecWezterm = execWezterm as unknown as ReturnType<typeof vi.fn>;
const mockIsWeztermAvailable = isWeztermAvailable as unknown as ReturnType<typeof vi.fn>;
const mockBuildShellCommand = buildShellCommand as unknown as ReturnType<typeof vi.fn>;
const mockListPaneIds = listPaneIds as unknown as ReturnType<typeof vi.fn>;

describe('WezTermPaneDriver integration', () => {
  let driver: WezTermPaneDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecWezterm.mockReset();
    mockIsWeztermAvailable.mockReset();
    mockBuildShellCommand.mockReset();
    mockListPaneIds.mockReset();
    mockBuildShellCommand.mockReturnValue(['cmd', '/c', 'echo hello']);
    driver = new WezTermPaneDriver();
    mockIsWeztermAvailable.mockReturnValue(true);
    mockListPaneIds.mockResolvedValue(['12345']);
  });

  it('isAvailable returns true when wezterm is in PATH', () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    expect(driver.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when wezterm is not found', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    expect(driver.isAvailable()).toBe(false);
  });

  it('launch creates pane with correct wezterm CLI args', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    const instance = await driver.launch('echo hello');
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['cli', 'split-pane', '--'])
    );
    expect(instance.id).toMatch(/^wezterm-pane-/);
  });

  it('launch includes direction flag', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    await driver.launch('echo hello', { direction: 'horizontal' });
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['--direction', 'right'])
    );
  });

  it('kill sends kill-pane command with correct pane-id', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '12345'])
    );
  });

  it('close(0) triggers kill-pane', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 0);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '12345'])
    );
  });

  it('close(1) does not trigger kill-pane', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 1);
    const killCalls = mockExecWezterm.mock.calls.filter((call: any) =>
      call[0]?.includes?.('kill-pane')
    );
    expect(killCalls.length).toBe(0);
  });

  it('isAlive returns true when pane exists', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    mockListPaneIds.mockResolvedValue(['12345', '67890']);
    const instance = await driver.launch('echo hello');
    expect(await driver.isAlive(instance)).toBe(true);
  });

  it('isAlive returns false when pane is missing', async () => {
    mockExecWezterm.mockResolvedValue('12345\r\n');
    mockListPaneIds.mockResolvedValue(['67890']);
    const instance = await driver.launch('echo hello');
    expect(await driver.isAlive(instance)).toBe(false);
  });
});
