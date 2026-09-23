export class TaskTimeout extends Error {
  constructor(message?: string) {
    super(message ?? 'Task timed out');
    this.name = 'TaskTimeout';
  }
}

export interface TimeoutWatchdogOptions {
  timeoutMs?: number;
  kill: () => void | Promise<void>;
}

export class TimeoutWatchdog {
  private timeoutMs: number;
  private killCallback: () => void | Promise<void>;
  private timer: NodeJS.Timeout | null;
  private settled: boolean;

  constructor(options: TimeoutWatchdogOptions) {
    this.timeoutMs = options.timeoutMs ?? 300_000;
    this.killCallback = options.kill;
    this.timer = null;
    this.settled = false;
  }

  async wrap<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.timer = setTimeout(() => {
        if (!this.settled) {
          this.settled = true;
          const result = this.killCallback();
          if (result && typeof result.then === 'function') {
            result.catch(() => {});
          }
          reject(new TaskTimeout());
        }
      }, this.timeoutMs);

      task()
        .then((value) => {
          if (!this.settled) {
            this.settled = true;
            this.clear();
            resolve(value);
          }
        })
        .catch((error) => {
          if (!this.settled) {
            this.settled = true;
            this.clear();
            reject(error);
          }
        });
    });
  }

  private clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
