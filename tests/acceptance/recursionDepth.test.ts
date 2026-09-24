import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dispatcher, MaxRecursionDepthExceeded } from '../../src/core/dispatcher.js';
import type { DispatchRequest } from '../../src/core/dispatcher.js';
import { HeadlessDriver } from '../../src/surfaces/headless.js';
import { PiRuntime } from '../../src/runtimes/piRuntime.js';

vi.mock('../../src/surfaces/headless.js');
vi.mock('../../src/runtimes/piRuntime.js');
vi.mock('../../src/ipc/mailbox.js');

import { Mailbox } from '../../src/ipc/mailbox.js';

const mockedMailboxCtor = Mailbox as unknown as ReturnType<typeof vi.fn>;
const mockedLaunch = vi.mocked(HeadlessDriver.prototype.launch);
const mockedBuildCommand = vi.mocked(PiRuntime.prototype.buildCommand);

describe('AC2: PI_AGENT_DEPTH=2 throws deterministic error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PI_AGENT_DEPTH = '0';
    mockedMailboxCtor.mockClear();
    mockedLaunch.mockResolvedValue({
      id: 'inst-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);
    mockedBuildCommand.mockReturnValue('pi --task-id "task-123" "do work"');
  });

  it('throws MaxRecursionDepthExceeded when depth is 2', async () => {
    process.env.PI_AGENT_DEPTH = '2';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow(MaxRecursionDepthExceeded);
  });

  it('throws when depth is 3', async () => {
    process.env.PI_AGENT_DEPTH = '3';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow(MaxRecursionDepthExceeded);
  });

  it('allows dispatch when depth is 1', async () => {
    process.env.PI_AGENT_DEPTH = '1';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).resolves.toBeDefined();
    expect(mockedLaunch).toHaveBeenCalled();
  });

  it('does not spawn any process when depth >= 2', async () => {
    process.env.PI_AGENT_DEPTH = '2';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow(MaxRecursionDepthExceeded);
    expect(mockedLaunch).not.toHaveBeenCalled();
    expect(mockedBuildCommand).not.toHaveBeenCalled();
  });

  it('does not write mailbox input when depth >= 2', async () => {
    process.env.PI_AGENT_DEPTH = '2';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow();
    expect(mockedMailboxCtor).not.toHaveBeenCalled();
  });
});
