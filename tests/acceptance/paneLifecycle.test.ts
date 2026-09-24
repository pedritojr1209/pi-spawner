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

import { execWezterm, buildShellCommand, listPaneIds } from '../../src/surfaces/weztermCli.js';

const mockExecWezterm = execWezterm as unknown as ReturnType<typeof vi.fn>;
const mockBuildShellCommand = buildShellCommand as unknown as ReturnType<typeof vi.fn>;
const mockListPaneIds = listPaneIds as unknown as ReturnType<typeof vi.fn>;

describe('AC4: Pane lifecycle on exit code', () => {
  let driver: WezTermPaneDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecWezterm.mockReset();
    mockBuildShellCommand.mockReset();
    mockListPaneIds.mockReset();
    mockBuildShellCommand.mockReturnValue(['cmd', '/c', 'echo hello']);
    driver = new WezTermPaneDriver();
    mockExecWezterm.mockResolvedValue('12345\r\n');
    mockListPaneIds.mockResolvedValue(['12345']);
  });

  it('closes pane when subagent exits with code 0', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 0);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', '12345'])
    );
  });

  it('preserves pane when subagent exits with code 1', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 1);
    const killCalls = mockExecWezterm.mock.calls.filter((call: any) =>
      call[0]?.includes?.('kill-pane')
    );
    expect(killCalls.length).toBe(0);
  });

  it('preserves pane when subagent exits with non-zero code', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, 2);
    const killCalls = mockExecWezterm.mock.calls.filter((call: any) =>
      call[0]?.includes?.('kill-pane')
    );
    expect(killCalls.length).toBe(0);
  });

  it('does not close pane when exitCode is null (still running)', async () => {
    const instance = await driver.launch('echo hello');
    await driver.close(instance, null as any);
    const killCalls = mockExecWezterm.mock.calls.filter((call: any) =>
      call[0]?.includes?.('kill-pane')
    );
    expect(killCalls.length).toBe(0);
  });
});
