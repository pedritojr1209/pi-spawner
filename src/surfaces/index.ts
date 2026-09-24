import type { SurfaceDriver } from './surface.interface.js';
import { HeadlessDriver } from './headless.js';
import { WezTermPaneDriver } from './weztermPane.js';
import { WezTermTabDriver } from './weztermTab.js';

export type SurfaceType = 'headless' | 'wezterm-pane' | 'wezterm-tab';

const surfaceMap: Record<SurfaceType, SurfaceDriver> = {
  headless: new HeadlessDriver(),
  'wezterm-pane': new WezTermPaneDriver(),
  'wezterm-tab': new WezTermTabDriver(),
};

export function getSurfaceDriver(name: string): SurfaceDriver {
  const driver = surfaceMap[name as SurfaceType];
  if (!driver) {
    throw new Error(`Unknown surface: ${name}`);
  }
  return driver;
}

export function getAvailableSurfaces(): SurfaceType[] {
  return Object.keys(surfaceMap) as SurfaceType[];
}
