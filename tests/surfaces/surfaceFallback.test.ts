import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeadlessDriver } from '../../src/surfaces/headless.js';
import { WezTermPaneDriver } from '../../src/surfaces/weztermPane.js';
import { WezTermTabDriver } from '../../src/surfaces/weztermTab.js';

vi.mock('../../src/surfaces/weztermCli.js');

import { isWeztermAvailable } from '../../src/surfaces/weztermCli.js';

const mockIsWeztermAvailable = isWeztermAvailable as unknown as ReturnType<typeof vi.fn>;

describe('Surface fallback integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsWeztermAvailable.mockReset();
  });

  it('HeadlessDriver is always available', () => {
    const driver = new HeadlessDriver();
    expect(driver.isAvailable()).toBe(true);
  });

  it('WezTermPaneDriver falls back to false when wezterm is missing', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    const driver = new WezTermPaneDriver();
    expect(driver.isAvailable()).toBe(false);
  });

  it('WezTermTabDriver falls back to false when wezterm is missing', () => {
    mockIsWeztermAvailable.mockReturnValue(false);
    const driver = new WezTermTabDriver();
    expect(driver.isAvailable()).toBe(false);
  });

  it('WezTermPaneDriver is available when wezterm is present', () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    const driver = new WezTermPaneDriver();
    expect(driver.isAvailable()).toBe(true);
  });

  it('WezTermTabDriver is available when wezterm is present', () => {
    mockIsWeztermAvailable.mockReturnValue(true);
    const driver = new WezTermTabDriver();
    expect(driver.isAvailable()).toBe(true);
  });
});
