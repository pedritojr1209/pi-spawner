import { describe, it, expect, vi } from 'vitest';

describe('extension entry point', () => {
  it('is the default export and is a function', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.default).toBe('function');
  });

  it('registers /agent command and subagent tool on pi instance', async () => {
    const registerCommand = vi.fn();
    const registerTool = vi.fn();
    const pi = { registerCommand, registerTool };

    const mod = await import('./index.js');
    mod.default(pi);

    expect(registerCommand).toHaveBeenCalledWith('/agent', expect.any(Function));
    expect(registerTool).toHaveBeenCalledWith('subagent', expect.objectContaining({
      description: expect.any(String),
      parameters: expect.any(Object),
      execute: expect.any(Function),
    }));
  });

  it('exports core library classes and functions', async () => {
    const mod = await import('./index.js');
    expect(mod.Ingress).toBeDefined();
    expect(mod.Dispatcher).toBeDefined();
    expect(mod.Mailbox).toBeDefined();
    expect(mod.AgentDiscovery).toBeDefined();
    expect(mod.getRuntimeDriver).toBeDefined();
    expect(mod.getSurfaceDriver).toBeDefined();
    expect(mod.projectContext).toBeDefined();
  });
});
