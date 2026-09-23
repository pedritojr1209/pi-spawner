import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const BOOTSTRAP_PATH = join(process.cwd(), 'src', 'scripts', 'bootstrap.ps1');

describe('bootstrap.ps1 contract', () => {
  beforeAll(() => {
    if (!existsSync(join(process.cwd(), 'src', 'scripts'))) {
      mkdirSync(join(process.cwd(), 'src', 'scripts'), { recursive: true });
    }
  });

  it('exists at the expected path', () => {
    expect(existsSync(BOOTSTRAP_PATH)).toBe(true);
  });

  it('is a non-empty file', () => {
    const content = readFileSync(BOOTSTRAP_PATH, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('reads input.json from a task directory', () => {
    const content = readFileSync(BOOTSTRAP_PATH, 'utf-8');
    expect(content).toMatch(/input\.json/);
  });

  it('writes result.json using atomic tmp rename', () => {
    const content = readFileSync(BOOTSTRAP_PATH, 'utf-8');
    expect(content).toMatch(/\.tmp/);
    expect(content).toMatch(/rename/i);
  });

  it('outputs UTF-8 without BOM', () => {
    const buffer = readFileSync(BOOTSTRAP_PATH);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).not.toBe(0xEF);
    expect(buffer[1]).not.toBe(0xBB);
    expect(buffer[2]).not.toBe(0xBF);
  });
});
