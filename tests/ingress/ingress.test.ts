import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ingress, type SlashCommandResult } from '../../src/ingress/index.js';

vi.mock('../../src/ingress/discovery.js');
vi.mock('../../src/core/dispatcher.js');
vi.mock('../../src/ingress/picker.js');
vi.mock('node:readline', async () => {
  const actual = await vi.importActual('node:readline');
  return {
    __esModule: true,
    default: actual,
    createInterface: vi.fn(),
  };
});

import { AgentDiscovery } from '../../src/ingress/discovery.js';
import { Dispatcher } from '../../src/core/dispatcher.js';
import { AgentPicker } from '../../src/ingress/picker.js';

describe('Ingress.handleSlashCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for unrecognized input', async () => {
    const result = await Ingress.handleSlashCommand('/other command');
    expect(result).toBeNull();
  });

  it('dispatches direct command and returns result', async () => {
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

    const result = await Ingress.handleSlashCommand('/agent scout "Find auth routes"');
    expect(result).not.toBeNull();
    expect(result?.taskId).toBe('task-123');
    expect(result?.agentName).toBe('scout');
    expect(Dispatcher.dispatch).toHaveBeenCalledWith({
      manifest: mockManifest,
      task: 'Find auth routes',
      cliOptions: undefined,
    });
  });

  it('dispatches direct command with --model flag', async () => {
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

    const result = await Ingress.handleSlashCommand('/agent scout "do work" --model=deepseek');
    expect(result).not.toBeNull();
    expect(result?.taskId).toBe('task-456');
    expect(Dispatcher.dispatch).toHaveBeenCalledWith({
      manifest: mockManifest,
      task: 'do work',
      cliOptions: { model: 'deepseek' },
    });
  });

  it('throws when agent not found for direct command', async () => {
    vi.mocked(AgentDiscovery.discover).mockResolvedValue([]);

    await expect(Ingress.handleSlashCommand('/agent nonexistent "task"')).rejects.toThrow(
      'Agent not found: nonexistent'
    );
  });

  it('returns null when picker is cancelled', async () => {
    vi.mocked(AgentPicker.select).mockResolvedValue(null);

    const result = await Ingress.handleSlashCommand('/agent');
    expect(result).toBeNull();
  });

  it('calls AgentPicker.select when picker is triggered', async () => {
    const mockManifest = {
      name: 'scout',
      runtime: 'agy',
      surface: 'wezterm-pane',
      description: 'Fast recon',
      source: 'local' as const,
      filePath: '/fake/.pi/agents/scout.md',
    };

    vi.mocked(AgentDiscovery.discover).mockResolvedValue([mockManifest]);
    vi.mocked(AgentPicker.select).mockResolvedValue(null);

    const result = await Ingress.handleSlashCommand('/agent');
    expect(result).toBeNull();
    expect(AgentPicker.select).toHaveBeenCalledWith(
      [mockManifest],
      { input: process.stdin, output: process.stdout }
    );
  });
});
