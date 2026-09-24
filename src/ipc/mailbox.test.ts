import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Mailbox, MailboxError } from './mailbox.js';

describe('Mailbox.awaitResult', () => {
  let mailbox: Mailbox;

  beforeEach(() => {
    mailbox = new Mailbox();
  });

  it('resolves immediately when result.json already exists', async () => {
    const taskId = `await-immediate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const dir = mailbox['taskDir'](taskId);
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/result.json`, JSON.stringify({
      taskId,
      exitCode: 0,
      summary: 'done',
      modifiedFiles: [],
      completedAt: new Date().toISOString(),
    }), 'utf-8');

    const result = await mailbox.awaitResult(taskId, 1000);
    expect(result.exitCode).toBe(0);
    expect(result.summary).toBe('done');
  });

  it('resolves when result.json appears within timeout', async () => {
    const taskId = `await-late-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const dir = mailbox['taskDir'](taskId);
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(dir, { recursive: true });

    const promise = mailbox.awaitResult(taskId, 5000);

    setTimeout(() => {
      writeFileSync(`${dir}/result.json`, JSON.stringify({
        taskId,
        exitCode: 0,
        summary: 'late result',
        modifiedFiles: ['a.txt'],
        completedAt: new Date().toISOString(),
      }), 'utf-8');
    }, 200);

    const result = await promise;
    expect(result.exitCode).toBe(0);
    expect(result.modifiedFiles).toEqual(['a.txt']);
  });

  it('rejects with timeout when result never appears', async () => {
    const taskId = `await-timeout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const promise = mailbox.awaitResult(taskId, 500);

    await expect(promise).rejects.toThrow(MailboxError);
    await expect(promise).rejects.toThrow(`Timeout waiting for result ${taskId}`);
  });
});
