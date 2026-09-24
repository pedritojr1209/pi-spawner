import { mkdirSync, writeFileSync, readFileSync, renameSync, existsSync, watch, type FSWatcher } from 'node:fs';
import { join, normalize } from 'path';
import type { TaskInput, TaskResult, TaskResultEnvelope } from '../types/envelope.js';

export class MailboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailboxError';
  }
}

const SPECIAL_CHARS_REGEX = /[^a-zA-Z0-9._-]/;

export class Mailbox {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || join(process.cwd(), '.pi-spawner', 'tasks');
  }

  private validateTaskId(taskId: string): void {
    if (!taskId || taskId.length === 0) {
      throw new MailboxError('taskId must not be empty');
    }

    const normalized = normalize(taskId);
    if (normalized.includes('..')) {
      throw new MailboxError('taskId must not contain path traversal (..)');
    }

    if (taskId.includes('/') || taskId.includes('\\')) {
      throw new MailboxError('taskId must not contain slashes');
    }

    if (taskId.startsWith('/') || /^[a-zA-Z]:/.test(taskId)) {
      throw new MailboxError('taskId must not be an absolute path');
    }

    if (SPECIAL_CHARS_REGEX.test(taskId)) {
      throw new MailboxError('taskId contains unsupported special characters');
    }

    const resolved = join(this.baseDir, taskId);
    if (!resolved.startsWith(this.baseDir)) {
      throw new MailboxError('taskId resolves outside the tasks directory');
    }
  }

  private taskDir(taskId: string): string {
    return join(this.baseDir, taskId);
  }

  async writeInput(taskId: string, input: TaskInput): Promise<string> {
    this.validateTaskId(taskId);
    const dir = this.taskDir(taskId);
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, 'input.json');
    writeFileSync(filePath, JSON.stringify(input, null, 2), 'utf-8');
    return filePath;
  }

  async writeResult(taskId: string, result: TaskResult): Promise<string> {
    this.validateTaskId(taskId);
    const dir = this.taskDir(taskId);
    mkdirSync(dir, { recursive: true });
    const tmpPath = join(dir, 'result.json.tmp');
    const finalPath = join(dir, 'result.json');
    writeFileSync(tmpPath, JSON.stringify(result, null, 2), 'utf-8');
    renameSync(tmpPath, finalPath);
    return finalPath;
  }

  async readResult(taskId: string): Promise<TaskResultEnvelope> {
    this.validateTaskId(taskId);
    const path = join(this.taskDir(taskId), 'result.json');
    if (!existsSync(path)) {
      throw new MailboxError(`No result.json found for task ${taskId}`);
    }
    try {
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw) as TaskResultEnvelope;
    } catch {
      throw new MailboxError(`Malformed result.json for task ${taskId}`);
    }
  }

  async awaitResult(taskId: string, timeoutMs = 5 * 60 * 1000): Promise<TaskResultEnvelope> {
    this.validateTaskId(taskId);
    const resultPath = join(this.taskDir(taskId), 'result.json');

    if (existsSync(resultPath)) {
      return this.readResult(taskId);
    }

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new MailboxError(`Timeout waiting for result ${taskId} after ${timeoutMs}ms`));
      }, timeoutMs);

      let pollHandle: NodeJS.Timeout | undefined;
      let watcher: FSWatcher | undefined;

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        if (pollHandle) clearInterval(pollHandle);
        if (watcher) {
          try {
            watcher.close();
          } catch {
            // ignore
          }
        }
      };

      const checkResult = () => {
        try {
          if (existsSync(resultPath)) {
            cleanup();
            try {
              resolve(this.readResult(taskId));
            } catch (error) {
              reject(error instanceof MailboxError ? error : new MailboxError(`Malformed result.json for task ${taskId}`));
            }
          }
        } catch {
          // ignore transient errors
        }
      };

      pollHandle = setInterval(checkResult, 500);

      try {
        watcher = watch(this.taskDir(taskId), { persistent: false }, (eventType) => {
          if (eventType === 'rename' || eventType === 'change') {
            checkResult();
          }
        });
      } catch {
        // fs.watch may fail on some platforms; rely on polling
      }
    });
  }
}
