import { describe, it, expect } from 'vitest';
import { SlashCommandParser, ParsedCommand } from '../../src/ingress/slashCommand.js';

describe('SlashCommandParser', () => {
  it('parses direct execution with name and task', () => {
    const result = SlashCommandParser.parse('/agent scout "Find all auth routes"');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('direct');
    if (result?.type === 'direct') {
      expect(result.agentName).toBe('scout');
      expect(result.task).toBe('Find all auth routes');
      expect(result.cliOptions).toBeUndefined();
    }
  });

  it('parses direct execution with --model flag', () => {
    const result = SlashCommandParser.parse('/agent scout "do work" --model=deepseek');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('direct');
    if (result?.type === 'direct') {
      expect(result.agentName).toBe('scout');
      expect(result.task).toBe('do work');
      expect(result.cliOptions?.model).toBe('deepseek');
    }
  });

  it('parses direct execution with --model flag with spaces around =', () => {
    const result = SlashCommandParser.parse('/agent scout "do work" --model = deepseek');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('direct');
    if (result?.type === 'direct') {
      expect(result.agentName).toBe('scout');
      expect(result.task).toBe('do work');
      expect(result.cliOptions?.model).toBe('deepseek');
    }
  });

  it('returns picker for /agent with no args', () => {
    const result = SlashCommandParser.parse('/agent');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('picker');
  });

  it('returns picker for /agent with only whitespace', () => {
    const result = SlashCommandParser.parse('/agent   ');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('picker');
  });

  it('returns null for unrecognized commands', () => {
    expect(SlashCommandParser.parse('/other command')).toBeNull();
    expect(SlashCommandParser.parse('hello')).toBeNull();
    expect(SlashCommandParser.parse('')).toBeNull();
  });

  it('handles quoted strings with escaped quotes', () => {
    const result = SlashCommandParser.parse('/agent scout "find the \\"auth\\" routes"');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('direct');
    if (result?.type === 'direct') {
      expect(result.task).toBe('find the "auth" routes');
    }
  });

  it('returns null when task is missing after agent name', () => {
    const result = SlashCommandParser.parse('/agent scout');
    expect(result).toBeNull();
  });
});
