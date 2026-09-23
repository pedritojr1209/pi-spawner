import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PathGuard, SecurityError } from './pathGuard.js';

describe('PathGuard', () => {
  const originalCwd = process.cwd();

  beforeAll(() => {
    process.chdir('G:\\Pi-OS\\projects\\pi-spawner');
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  it('allows a valid relative path within workspace', () => {
    expect(() => PathGuard.validate('src/index.ts')).not.toThrow();
  });

  it('hard-blocks directory traversal with ..', () => {
    expect(() => PathGuard.validate('..\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });

  it('hard-blocks absolute path outside workspace', () => {
    expect(() => PathGuard.validate('C:\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });

  it('throws SecurityError with exact message', () => {
    expect(() => PathGuard.validate('..\\..\\..')).toThrow(SecurityError);
    expect(() => PathGuard.validate('..\\..\\..')).toThrow('Access outside workspace is denied');
  });

  it('handles case-insensitive paths on Windows', () => {
    expect(() => PathGuard.validate('SRC\\INDEX.TS')).not.toThrow();
  });

  it('blocks paths that resolve outside workspace after normalization', () => {
    expect(() => PathGuard.validate('src\\..\\..\\Windows\\System32')).toThrow('Access outside workspace is denied');
  });
});
