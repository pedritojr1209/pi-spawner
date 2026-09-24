import { describe, it, expect } from 'vitest';
import { PathGuard, SecurityError } from '../../src/interceptors/pathGuard.js';

describe('AC5: File tool outside process.cwd() throws hard exception', () => {
  it('hard-blocks directory traversal with ..', () => {
    expect(() => PathGuard.validate('..\\Windows\\System32')).toThrow(SecurityError);
    expect(() => PathGuard.validate('..\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });

  it('hard-blocks absolute path outside workspace', () => {
    expect(() => PathGuard.validate('C:\\Windows\\System32')).toThrow(SecurityError);
    expect(() => PathGuard.validate('C:\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });

  it('blocks paths that resolve outside workspace after normalization', () => {
    expect(() => PathGuard.validate('src\\..\\..\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });

  it('blocks sibling folders with similar prefix', () => {
    expect(() => PathGuard.validate('..\\pi-spawner_fake')).toThrow('Access outside workspace is denied');
  });

  it('allows valid relative path within workspace', () => {
    expect(() => PathGuard.validate('src/index.ts')).not.toThrow();
  });

  it('allows workspace root itself', () => {
    expect(() => PathGuard.validate('.')).not.toThrow();
  });

  it('handles case-insensitive paths on Windows', () => {
    expect(() => PathGuard.validate('SRC\\INDEX.TS')).not.toThrow();
  });
});
