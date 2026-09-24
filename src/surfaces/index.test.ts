import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSurfaceDriver, getAvailableSurfaces, type SurfaceType } from './index.js';
import { HeadlessDriver } from './headless.js';
import { WezTermPaneDriver } from './weztermPane.js';
import { WezTermTabDriver } from './weztermTab.js';

describe('surface registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns HeadlessDriver for headless', () => {
    const driver = getSurfaceDriver('headless');
    expect(driver).toBeInstanceOf(HeadlessDriver);
  });

  it('returns WezTermPaneDriver for wezterm-pane', () => {
    const driver = getSurfaceDriver('wezterm-pane');
    expect(driver).toBeInstanceOf(WezTermPaneDriver);
  });

  it('returns WezTermTabDriver for wezterm-tab', () => {
    const driver = getSurfaceDriver('wezterm-tab');
    expect(driver).toBeInstanceOf(WezTermTabDriver);
  });

  it('throws for unknown surface', () => {
    expect(() => getSurfaceDriver('unknown' as SurfaceType)).toThrow('Unknown surface: unknown');
  });

  it('lists available surfaces', () => {
    const surfaces = getAvailableSurfaces();
    expect(surfaces).toEqual(['headless', 'wezterm-pane', 'wezterm-tab']);
  });
});
