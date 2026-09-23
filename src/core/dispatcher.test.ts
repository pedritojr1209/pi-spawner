import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dispatcher, MaxRecursionDepthExceeded } from './dispatcher.js';
import type { DispatchRequest } from './dispatcher.js';
import { HeadlessDriver } from '../surfaces/headless.js';
import { PiRuntime } from '../runtimes/piRuntime.js';

vi.mock('../surfaces/headless.js');
vi.mock('../runtimes/piRuntime.js');

describe('Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PI_AGENT_DEPTH = '0';
  });

  it('throws MaxRecursionDepthExceeded when depth > 2', async () => {
    process.env.PI_AGENT_DEPTH = '3';
    const request: DispatchRequest = {
      manifest: {
        name: 'test',
        runtime: 'pi',
        surface: 'headless',
      },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow(MaxRecursionDepthExceeded);
  });

  it('resolves model via CLI cascade', async () => {
    process.env.PI_AGENT_DEPTH = '0';
    vi.mocked(HeadlessDriver.prototype.launch).mockResolvedValue({
      id: 'inst-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);

    const request: DispatchRequest = {
      manifest: {
        name: 'test',
        runtime: 'pi',
        surface: 'headless',
        model: 'frontmatter-model',
      },
      task: 'do work',
      cliOptions: { model: 'cli-model' },
    };

    await Dispatcher.dispatch(request);
    expect(PiRuntime.prototype.buildCommand).toHaveBeenCalled();
  });
});
