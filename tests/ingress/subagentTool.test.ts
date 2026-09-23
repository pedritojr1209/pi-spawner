import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubagentTool, SubagentToolResult } from '../../src/ingress/subagentTool.js';

vi.mock('../../src/ingress/discovery.js');
vi.mock('../../src/core/dispatcher.js');
vi.mock('../../src/ipc/mailbox.js');

import { AgentDiscovery } from '../../src/ingress/discovery.js';
import { Dispatcher } from '../../src/core/dispatcher.js';
import { Mailbox } from '../../src/ipc/mailbox.js';

describe('SubagentTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('looks up agent manifest via discovery', async () => {
    const mockManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'wezterm-pane',
      description: 'Fast recon',
      source: 'local' as const,
      filePath: '/fake/.pi/agents/scout.md',
    };

    vi.mocked(AgentDiscovery.discover).mockResolvedValue([mockManifest]);
    vi.mocked(Dispatcher.dispatch).mockResolvedValue({
      taskId: 'task-123',
      surfaceInstance: { id: 'inst-1', pid: 1234, exitCode: null },
    });
    vi.mocked(Mailbox.prototype.readResult).mockResolvedValue({
      taskId: 'task-123',
      exitCode: 0,
      summary: 'done',
      modifiedFiles: [],
      completedAt: new Date().toISOString(),
    });

    const result = await SubagentTool.invoke('scout', 'do work');
    expect(AgentDiscovery.discover).toHaveBeenCalled();
    expect(Dispatcher.dispatch).toHaveBeenCalled();
  });

  it('returns structured result with taskId, summary, exitCode, and modifiedFiles', async () => {
    const mockManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'wezterm-pane',
      description: 'Fast recon',
      source: 'local' as const,
      filePath: '/fake/.pi/agents/scout.md',
    };

    vi.mocked(AgentDiscovery.discover).mockResolvedValue([mockManifest]);
    vi.mocked(Dispatcher.dispatch).mockResolvedValue({
      taskId: 'task-456',
      surfaceInstance: { id: 'inst-2', pid: 1234, exitCode: null },
    });
    vi.mocked(Mailbox.prototype.readResult).mockResolvedValue({
      taskId: 'task-456',
      exitCode: 0,
      summary: 'Task completed',
      modifiedFiles: ['src/foo.ts'],
      completedAt: new Date().toISOString(),
    });

    const result = await SubagentTool.invoke('scout', 'do work');
    expect(result.taskId).toBe('task-456');
    expect(result.summary).toBe('Task completed');
    expect(result.exitCode).toBe(0);
    expect(result.modifiedFiles).toEqual(['src/foo.ts']);
  });

  it('throws when agent name is not found', async () => {
    vi.mocked(AgentDiscovery.discover).mockResolvedValue([]);

    await expect(SubagentTool.invoke('nonexistent', 'do work')).rejects.toThrow();
  });

  it('delegates model override to dispatcher', async () => {
    const mockManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'wezterm-pane',
      description: 'Fast recon',
      source: 'local' as const,
      filePath: '/fake/.pi/agents/scout.md',
    };

    vi.mocked(AgentDiscovery.discover).mockResolvedValue([mockManifest]);
    vi.mocked(Dispatcher.dispatch).mockResolvedValue({
      taskId: 'task-789',
      surfaceInstance: { id: 'inst-3', pid: 1234, exitCode: null },
    });
    vi.mocked(Mailbox.prototype.readResult).mockResolvedValue({
      taskId: 'task-789',
      exitCode: 0,
      summary: 'done',
      modifiedFiles: [],
      completedAt: new Date().toISOString(),
    });

    await SubagentTool.invoke('scout', 'do work', { model: 'deepseek' });
    expect(Dispatcher.dispatch).toHaveBeenCalled();
  });
});
