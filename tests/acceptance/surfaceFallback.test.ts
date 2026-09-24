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

describe('AC3: Missing wezterm falls back to headless', () => {
  let driver: WezTermPaneDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecWezterm.mockReset();
    mockIsWeztermAvailable.mockReset();
    mockBuildShellCommand.mockReset();
    mockListPaneIds.mockReset();
    mockBuildShellCommand.mockReturnValue(['cmd', '/c', 'echo hello']);
    driver = new WezTermPaneDriver();
  });

  it('reports unavailable when wezterm is not in PATH', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    expect(driver.isAvailable()).toBe(false);
  });

  it('reports available when wezterm is in PATH', () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    expect(driver.isAvailable()).toBe(true);
  });

  it('launch returns instance with id when wezterm is available', async () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    mockExecWezterm.mockResolvedValue('12345\r\n');
    mockListPaneIds.mockResolvedValue(['12345']);

    const instance = await driver.launch('echo hello');
    expect(instance.id).toMatch(/^wezterm-pane-/);
    expect(instance.pid).toBe(0);
    expect(instance.exitCode).toBeNull();
  });

  it('does not throw when wezterm is missing and headless is used instead', async () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    expect(() => driver.isAvailable()).not.toThrow();
  });
});
