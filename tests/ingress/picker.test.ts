import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentPicker, PickerResult } from '../../src/ingress/picker.js';
import type { DiscoveredAgent } from '../../src/ingress/discovery.js';

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

import { createInterface } from 'node:readline';

describe('AgentPicker', () => {
  const mockAgents: DiscoveredAgent[] = [
    {
      name: 'scout',
      runtime: 'agy',
      surface: 'wezterm-pane',
      description: 'Fast recon',
      source: 'local',
      filePath: '/fake/.pi/agents/scout.md',
    },
    {
      name: 'coder',
      runtime: 'kilo',
      surface: 'headless',
      description: 'Write code',
      source: 'global',
      filePath: '/fake/home/.pi/agents/coder.md',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for empty agent list', async () => {
    const result = await AgentPicker.select([], { input: process.stdin, output: process.stdout } as any);
    expect(result).toBeNull();
  });

  it('returns selected agent by index', async () => {
    const mockQuestion = vi.fn((_prompt: string, cb: (answer: string) => void) => cb('1'));
    const mockClose = vi.fn();
    const mockRl = {
      question: mockQuestion,
      close: mockClose,
    };
    vi.mocked(createInterface).mockReturnValue(mockRl as any);

    const result = await AgentPicker.select(mockAgents, { input: process.stdin, output: process.stdout } as any);
    expect(result).not.toBeNull();
    expect(result?.agent.name).toBe('scout');
  });

  it('returns null when user cancels with q', async () => {
    const mockQuestion = vi.fn((_prompt: string, cb: (answer: string) => void) => cb('q'));
    const mockClose = vi.fn();
    const mockRl = {
      question: mockQuestion,
      close: mockClose,
    };
    vi.mocked(createInterface).mockReturnValue(mockRl as any);

    const result = await AgentPicker.select(mockAgents, { input: process.stdin, output: process.stdout } as any);
    expect(result).toBeNull();
  });

  it('returns null for out of range selection', async () => {
    const mockQuestion = vi.fn((_prompt: string, cb: (answer: string) => void) => cb('99'));
    const mockClose = vi.fn();
    const mockRl = {
      question: mockQuestion,
      close: mockClose,
    };
    vi.mocked(createInterface).mockReturnValue(mockRl as any);

    const result = await AgentPicker.select(mockAgents, { input: process.stdin, output: process.stdout } as any);
    expect(result).toBeNull();
  });

  it('handles numeric selection of second agent', async () => {
    const mockQuestion = vi.fn((_prompt: string, cb: (answer: string) => void) => cb('2'));
    const mockClose = vi.fn();
    const mockRl = {
      question: mockQuestion,
      close: mockClose,
    };
    vi.mocked(createInterface).mockReturnValue(mockRl as any);

    const result = await AgentPicker.select(mockAgents, { input: process.stdin, output: process.stdout } as any);
    expect(result).not.toBeNull();
    expect(result?.agent.name).toBe('coder');
  });

  it('formats prompt with agent names and descriptions', async () => {
    const mockQuestion = vi.fn((prompt: string, cb: (answer: string) => void) => {
      expect(prompt).toContain('scout');
      expect(prompt).toContain('coder');
      expect(prompt).toContain('Fast recon');
      expect(prompt).toContain('agy');
      cb('1');
      return mockQuestion;
    });
    const mockRl = {
      question: mockQuestion,
      close: vi.fn(),
    };
    vi.mocked(createInterface).mockReturnValue(mockRl as any);

    await AgentPicker.select(mockAgents, { input: process.stdin, output: process.stdout } as any);
  });
});
