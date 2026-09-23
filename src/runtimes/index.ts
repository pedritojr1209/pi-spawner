import type { RuntimeAdapter } from './runtime.interface.js';
import type { AgentManifest } from '../types/agent.js';
import { PiRuntime } from './piRuntime.js';
import { KiloRuntime } from './kilo.js';
import { AgyRuntime } from './agy.js';
import { OpenCodeRuntime } from './opencode.js';
import { GenericCliRuntime } from './generic.js';

const genericRuntime = new GenericCliRuntime();

const runtimeMap: Record<string, RuntimeAdapter> = {
  pi: new PiRuntime(),
  kilo: new KiloRuntime(),
  agy: new AgyRuntime(),
  opencode: new OpenCodeRuntime(),
  generic: genericRuntime,
  custom: genericRuntime,
};

export function getRuntimeDriver(name: string): RuntimeAdapter {
  const driver = runtimeMap[name];
  if (!driver) {
    throw new Error(`Unknown runtime: ${name}`);
  }
  return driver;
}

export function getAvailableRuntimes(): string[] {
  return Object.keys(runtimeMap);
}

export { PiRuntime, KiloRuntime, AgyRuntime, OpenCodeRuntime, GenericCliRuntime };
