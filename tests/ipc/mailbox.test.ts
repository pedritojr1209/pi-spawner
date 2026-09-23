import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Mailbox, MailboxError } from '../../src/ipc/mailbox.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TASKS_DIR = join(process.cwd(), '.pi-spawner', 'tasks');

describe('Mailbox', () => {
  beforeEach(() => {
    if (existsSync(TASKS_DIR)) {
      rmSync(TASKS_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TASKS_DIR)) {
      rmSync(TASKS_DIR, { recursive: true });
    }
  });

  it('creates the task directory when writing input', async () => {
    const mailbox = new Mailbox();
    const taskId = 'task-001';
    await mailbox.writeInput(taskId, {
      taskId,
      task: 'do work',
      contextMode: 'isolated',
    });
    expect(existsSync(join(TASKS_DIR, taskId))).toBe(true);
  });

  it('writes input.json with correct content', async () => {
    const mailbox = new Mailbox();
    const taskId = 'task-002';
    const input = {
      taskId,
      task: 'do work',
      contextMode: 'isolated' as const,
    };
    const path = await mailbox.writeInput(taskId, input);
    expect(path).toBe(join(TASKS_DIR, taskId, 'input.json'));
    const raw = require('fs').readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.taskId).toBe(taskId);
    expect(parsed.task).toBe('do work');
    expect(parsed.contextMode).toBe('isolated');
  });

  it('atomically writes result.json via tmp rename', async () => {
    const mailbox = new Mailbox();
    const taskId = 'task-003';
    const result = {
      taskId,
      exitCode: 0,
      summary: 'done',
      modifiedFiles: [],
      completedAt: new Date().toISOString(),
    };
    const path = await mailbox.writeResult(taskId, result);
    expect(path).toBe(join(TASKS_DIR, taskId, 'result.json'));
    expect(existsSync(path)).toBe(true);
    const raw = require('fs').readFileSync(path, 'utf-8');
    expect(JSON.parse(raw).exitCode).toBe(0);
  });

  it('reads result.json back correctly', async () => {
    const mailbox = new Mailbox();
    const taskId = 'task-004';
    const result = {
      taskId,
      exitCode: 0,
      summary: 'done',
      modifiedFiles: ['src/foo.ts'],
      completedAt: new Date().toISOString(),
    };
    await mailbox.writeResult(taskId, result);
    const read = await mailbox.readResult(taskId);
    expect(read.taskId).toBe(taskId);
    expect(read.exitCode).toBe(0);
    expect(read.summary).toBe('done');
    expect(read.modifiedFiles).toEqual(['src/foo.ts']);
  });

  it('rejects taskId with slashes', async () => {
    const mailbox = new Mailbox();
    await expect(mailbox.writeInput('a/b', {
      taskId: 'a/b',
      task: 'x',
      contextMode: 'isolated',
    })).rejects.toThrow(MailboxError);
  });

  it('rejects taskId with ..', async () => {
    const mailbox = new Mailbox();
    await expect(mailbox.writeInput('..\\foo', {
      taskId: '..\\foo',
      task: 'x',
      contextMode: 'isolated',
    })).rejects.toThrow(MailboxError);
  });

  it('rejects absolute path taskId', async () => {
    const mailbox = new Mailbox();
    await expect(mailbox.writeInput('/absolute/path', {
      taskId: '/absolute/path',
      task: 'x',
      contextMode: 'isolated',
    })).rejects.toThrow(MailboxError);
  });

  it('rejects taskId with special characters', async () => {
    const mailbox = new Mailbox();
    await expect(mailbox.writeInput('task<>:"|?*', {
      taskId: 'task<>:"|?*',
      task: 'x',
      contextMode: 'isolated',
    })).rejects.toThrow(MailboxError);
  });

  it('throws when reading result for missing task', async () => {
    const mailbox = new Mailbox();
    await expect(mailbox.readResult('nonexistent')).rejects.toThrow(MailboxError);
  });

  it('throws when reading malformed result.json', async () => {
    const mailbox = new Mailbox();
    const taskId = 'task-malformed';
    mkdirSync(join(TASKS_DIR, taskId), { recursive: true });
    writeFileSync(join(TASKS_DIR, taskId, 'result.json'), 'not-json');
    await expect(mailbox.readResult(taskId)).rejects.toThrow(MailboxError);
  });
});
