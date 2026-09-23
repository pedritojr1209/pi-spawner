import { describe, it, expect } from 'vitest';
import { ToolFilter } from './toolFilter.js';
import type { AgentManifest } from '../types/agent.js';

describe('ToolFilter', () => {
  it('returns empty array when no tools defined', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
    };
    expect(ToolFilter.filter(manifest)).toEqual([]);
  });

  it('returns empty array for empty tools list', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
      tools: [],
    };
    expect(ToolFilter.filter(manifest)).toEqual([]);
  });

  it('returns allowed tools from manifest', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
      tools: ['read_file', 'write_file', 'search'],
    };
    expect(ToolFilter.filter(manifest)).toEqual(['read_file', 'write_file', 'search']);
  });

  it('filters to only allowed tools', () => {
    const manifest: AgentManifest = {
      name: 'test',
      runtime: 'pi',
      surface: 'headless',
      tools: ['read_file', 'execute'],
    };
    expect(ToolFilter.filter(manifest)).toEqual(['read_file', 'execute']);
  });
});
