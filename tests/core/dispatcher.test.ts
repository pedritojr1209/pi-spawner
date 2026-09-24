import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Dispatcher, MaxRecursionDepthExceeded } from '../../src/core/dispatcher.js';
import type { DispatchRequest } from '../../src/core/dispatcher.js';
import { HeadlessDriver } from '../../src/surfaces/headless.js';
import { Mailbox } from '../../src/ipc/mailbox.js';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

vi.mock('../../src/surfaces/headless.js');
vi.mock('../../src/runtimes/piRuntime.js');

const TASKS_DIR = join(process.cwd(), '.pi-spawner', 'tasks');

describe('Dispatcher integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PI_AGENT_DEPTH = '0';
    if (existsSync(TASKS_DIR)) {
      rmSync(TASKS_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TASKS_DIR)) {
      rmSync(TASKS_DIR, { recursive: true });
    }
  });

  it('creates task directory and writes input.json', async () => {
    vi.mocked(HeadlessDriver.prototype.launch).mockResolvedValue({
      id: 'headless-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);

    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    const result = await Dispatcher.dispatch(request);
    expect(result.taskId).toMatch(/^task-/);
    const taskDir = join(TASKS_DIR, result.taskId);
    expect(existsSync(taskDir)).toBe(true);
    expect(existsSync(join(taskDir, 'input.json'))).toBe(true);
  });

  it('returns surface instance with id, pid, and exitCode', async () => {
    vi.mocked(HeadlessDriver.prototype.launch).mockResolvedValue({
      id: 'headless-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);

    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    const result = await Dispatcher.dispatch(request);
    expect(result.surfaceInstance.id).toBe('headless-1');
    expect(result.surfaceInstance.pid).toBe(1234);
    expect(result.surfaceInstance.exitCode).toBe(0);
  });

  it('increments PI_AGENT_DEPTH after successful dispatch', async () => {
    process.env.PI_AGENT_DEPTH = '0';
    vi.mocked(HeadlessDriver.prototype.launch).mockResolvedValue({
      id: 'headless-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);

    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await Dispatcher.dispatch(request);
    expect(process.env.PI_AGENT_DEPTH).toBe('1');
  });

  it('writes input.json with correct task content', async () => {
    vi.mocked(HeadlessDriver.prototype.launch).mockResolvedValue({
      id: 'headless-1',
      pid: 1234,
      exitCode: 0,
      startedAt: new Date(),
      endedAt: null,
    } as any);

    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    const result = await Dispatcher.dispatch(request);
    const inputPath = join(TASKS_DIR, result.taskId, 'input.json');
    const raw = readFileSync(inputPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.prompt).toBe('do work');
    expect(parsed.agentName).toBe('test');
  });

  it('does not increment PI_AGENT_DEPTH when dispatch throws', async () => {
    process.env.PI_AGENT_DEPTH = '2';
    const request: DispatchRequest = {
      manifest: { name: 'test', runtime: 'pi', surface: 'headless' },
      task: 'do work',
    };

    await expect(Dispatcher.dispatch(request)).rejects.toThrow(MaxRecursionDepthExceeded);
    expect(process.env.PI_AGENT_DEPTH).toBe('2');
  });
});
