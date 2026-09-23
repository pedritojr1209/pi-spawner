import { describe, it, expect } from 'vitest';
import { projectContext } from '../../src/ipc/contextProjection.js';

describe('projectContext', () => {
  it('returns prompt untouched in isolated mode', () => {
    const result = projectContext('hello world', undefined, 'isolated');
    expect(result).toBe('hello world');
  });

  it('returns prompt untouched in isolated mode with context', () => {
    const result = projectContext('hello world', {
      decisions: ['use pgvector'],
      constraints: ['no external APIs'],
    }, 'isolated');
    expect(result).toBe('hello world');
  });

  it('prepends markdown brief in projected mode', () => {
    const result = projectContext('do the thing', {
      decisions: ['use pgvector'],
      constraints: ['no external APIs'],
      anchors: ['src/db.ts:12'],
    }, 'projected');
    expect(result).toContain('do the thing');
    expect(result).toContain('Task Summary');
    expect(result).toContain('Prior Decisions');
    expect(result).toContain('Constraints');
    expect(result).toContain('File Anchors');
    expect(result).toContain('use pgvector');
    expect(result).toContain('no external APIs');
    expect(result).toContain('src/db.ts:12');
  });

  it('handles empty context arrays gracefully in projected mode', () => {
    const result = projectContext('do the thing', {}, 'projected');
    expect(result).toContain('do the thing');
    expect(result).toContain('Task Summary');
  });

  it('handles undefined context in projected mode', () => {
    const result = projectContext('do the thing', undefined, 'projected');
    expect(result).toContain('do the thing');
    expect(result).toContain('Task Summary');
  });

  it('returns prompt untouched when mode is native (unsupported)', () => {
    const result = projectContext('hello world', undefined, 'native');
    expect(result).toBe('hello world');
  });

  it('returns prompt untouched when mode is native with context', () => {
    const result = projectContext('hello world', {
      decisions: ['x'],
    }, 'native');
    expect(result).toBe('hello world');
  });

  it('defaults to isolated behavior when no mode provided', () => {
    const result = projectContext('hello world', undefined, undefined);
    expect(result).toBe('hello world');
  });
});
