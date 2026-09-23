import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentDiscovery, DiscoveredAgent } from '../../src/ingress/discovery.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const PI_AGENTS_LOCAL = join(process.cwd(), '.pi', 'agents');
const PI_AGENTS_GLOBAL = join('/fake/home', '.pi', 'agents');

describe('AgentDiscovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (existsSync(PI_AGENTS_LOCAL)) {
      rmSync(PI_AGENTS_LOCAL, { recursive: true });
    }
    const globalDir = join('/fake/home', '.pi', 'agents');
    if (existsSync(globalDir)) {
      rmSync(globalDir, { recursive: true });
    }
  });

  it('returns empty array when both directories are missing', async () => {
    vi.spyOn(require('os'), 'homedir').mockReturnValue('/fake/home');
    const agents = await AgentDiscovery.discover();
    expect(agents).toEqual([]);
  });

  it('discovers local agents', async () => {
    mkdirSync(PI_AGENTS_LOCAL, { recursive: true });
    writeFileSync(join(PI_AGENTS_LOCAL, 'scout.md'), `---
name: scout
runtime: agy
surface: wezterm-pane
description: Fast recon
---
# Scout Agent
`);
    const agents = await AgentDiscovery.discover();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('scout');
    expect(agents[0].runtime).toBe('agy');
    expect(agents[0].surface).toBe('wezterm-pane');
    expect(agents[0].description).toBe('Fast recon');
    expect(agents[0].source).toBe('local');
  });

  it('discovers global agents when local is missing', async () => {
    vi.spyOn(require('os'), 'homedir').mockReturnValue('/fake/home');
    mkdirSync(PI_AGENTS_GLOBAL, { recursive: true });
    writeFileSync(join(PI_AGENTS_GLOBAL, 'scout.md'), `---
name: scout
runtime: kilo
surface: headless
---
# Scout Global
`);
    const agents = await AgentDiscovery.discover();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('scout');
    expect(agents[0].runtime).toBe('kilo');
    expect(agents[0].source).toBe('global');
  });

  it('local agents override global agents with same name', async () => {
    vi.spyOn(require('os'), 'homedir').mockReturnValue('/fake/home');
    mkdirSync(PI_AGENTS_LOCAL, { recursive: true });
    mkdirSync(PI_AGENTS_GLOBAL, { recursive: true });
    writeFileSync(join(PI_AGENTS_GLOBAL, 'scout.md'), `---
name: scout
runtime: kilo
surface: headless
---
Global scout
`);
    writeFileSync(join(PI_AGENTS_LOCAL, 'scout.md'), `---
name: scout
runtime: agy
surface: wezterm-pane
---
Local scout
`);
    const agents = await AgentDiscovery.discover();
    expect(agents).toHaveLength(1);
    expect(agents[0].runtime).toBe('agy');
    expect(agents[0].source).toBe('local');
  });

  it('skips malformed frontmatter', async () => {
    mkdirSync(PI_AGENTS_LOCAL, { recursive: true });
    writeFileSync(join(PI_AGENTS_LOCAL, 'bad.md'), `---
name: bad
runtime: not-valid
this is not yaml
---
`);
    const agents = await AgentDiscovery.discover();
    expect(agents).toHaveLength(0);
  });

  it('returns agents sorted by name', async () => {
    mkdirSync(PI_AGENTS_LOCAL, { recursive: true });
    writeFileSync(join(PI_AGENTS_LOCAL, 'zebra.md'), `---
name: zebra
runtime: agy
surface: headless
---
`);
    writeFileSync(join(PI_AGENTS_LOCAL, 'alpha.md'), `---
name: alpha
runtime: kilo
surface: headless
---
`);
    const agents = await AgentDiscovery.discover();
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('alpha');
    expect(agents[1].name).toBe('zebra');
  });
});
