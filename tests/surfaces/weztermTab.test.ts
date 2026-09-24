import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WezTermTabDriver } from '../../src/surfaces/weztermTab.js';

vi.mock('../../src/surfaces/weztermCli.js', async () => {
  const actual = await vi.importActual('../../src/surfaces/weztermCli.js');
  return {
    ...actual,
    execWezterm: vi.fn(),
    isWeztermAvailable: vi.fn(),
    buildShellCommand: vi.fn().mockReturnValue(['cmd', '/c', 'echo hello']),
  };
});

import { execWezterm, isWeztermAvailable } from '../../src/surfaces/weztermCli.js';

const mockExecWezterm = execWezterm as unknown as ReturnType<typeof vi.fn>;
const mockIsWeztermAvailable = isWeztermAvailable as unknown as ReturnType<typeof vi.fn>;

describe('WezTermTabDriver integration', () => {
  let driver: WezTermTabDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecWezterm.mockReset();
    mockIsWeztermAvailable.mockReset();
    driver = new WezTermTabDriver();
    mockIsWeztermAvailable.mockReturnValue(true);
  });

  it('isAvailable returns true when wezterm is in PATH', () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    expect(driver.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when wezterm is not found', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    expect(driver.isAvailable()).toBe(false);
  });

  it('launch creates tab with correct wezterm CLI args', async () => {
    mockExecWezterm.mockResolvedValue('');
    const instance = await driver.launch('echo hello');
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['cli', 'spawn'])
    );
    expect(instance.id).toMatch(/^wezterm-tab-/);
  });

  it('kill sends kill-pane command with pane-id', async () => {
    mockExecWezterm.mockResolvedValue('tab-123\r\n');
    const instance = await driver.launch('echo hello');
    await driver.kill(instance);
    expect(mockExecWezterm).toHaveBeenCalledWith(
      expect.arrayContaining(['kill-pane', '--pane-id', 'tab-123'])
    );
  });
});
