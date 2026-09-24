import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dispatcher, MaxRecursionDepthExceeded } from '../../src/core/dispatcher.js';
import type { DispatchRequest } from '../../src/core/dispatcher.js';
import { HeadlessDriver } from '../../src/surfaces/headless.js';

vi.mock('../../src/surfaces/headless.js');
vi.mock('../../src/runtimes/piRuntime.js');
vi.mock('../../src/ipc/mailbox.js');

import { Mailbox } from '../../src/ipc/mailbox.js';

const mockedMailboxCtor = Mailbox as unknown as ReturnType<typeof vi.fn>;
const mockedLaunch = vi.mocked(HeadlessDriver.prototype.launch);

function getWriteInputModel(requestIndex: number): string | undefined {
  const mailboxInstance = mockedMailboxCtor.mock.instances[requestIndex];
  const writeInputCalls = (mailboxInstance?.writeInput as ReturnType<typeof vi.fn>)?.mock?.calls;
  const inputEnvelope = writeInputCalls?.[0]?.[1];
  return inputEnvelope?.model;
}

describe('AC1: Model cascade precedence', () => {
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
  });

  it('CLI flag overrides frontmatter and parent', async () => {
    const request: DispatchRequest = {
      manifest: {
        name: 'scout',
        runtime: 'pi',
        surface: 'headless',
        model: 'frontmatter-model',
      },
      task: 'do work',
      cliOptions: { model: 'cli-model' },
      parentSessionModel: 'parent-model',
    };

    await Dispatcher.dispatch(request);
    expect(getWriteInputModel(mockedMailboxCtor.mock.calls.length - 1)).toBe('cli-model');
  });

  it('frontmatter overrides parent when no CLI flag', async () => {
    const request: DispatchRequest = {
      manifest: {
        name: 'scout',
        runtime: 'pi',
        surface: 'headless',
        model: 'frontmatter-model',
      },
      task: 'do work',
      parentSessionModel: 'parent-model',
    };

    await Dispatcher.dispatch(request);
    expect(getWriteInputModel(mockedMailboxCtor.mock.calls.length - 1)).toBe('frontmatter-model');
  });

  it('parent fallback when no CLI flag and no frontmatter', async () => {
    const request: DispatchRequest = {
      manifest: {
        name: 'scout',
        runtime: 'pi',
        surface: 'headless',
      },
      task: 'do work',
      parentSessionModel: 'parent-model',
    };

    await Dispatcher.dispatch(request);
    expect(getWriteInputModel(mockedMailboxCtor.mock.calls.length - 1)).toBe('parent-model');
  });

  it('empty string when no model sources', async () => {
    const request: DispatchRequest = {
      manifest: {
        name: 'scout',
        runtime: 'pi',
        surface: 'headless',
      },
      task: 'do work',
    };

    await Dispatcher.dispatch(request);
    expect(getWriteInputModel(mockedMailboxCtor.mock.calls.length - 1)).toBe('');
  });
});
