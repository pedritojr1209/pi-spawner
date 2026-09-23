export class ConcurrencyLimitExceeded extends Error {
  constructor(message?: string) {
    super(message ?? 'Concurrency limit exceeded');
    this.name = 'ConcurrencyLimitExceeded';
  }
}

export interface ConcurrencyLimiterOptions {
  maxConcurrency?: number;
}

export class ConcurrencyLimiter {
  private maxConcurrency: number;
  private activeCount: number;
  private waitQueue: Array<() => void>;

  constructor(options: ConcurrencyLimiterOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 3;
    this.activeCount = 0;
    this.waitQueue = [];
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve as () => void);
    });
  }

  tryAcquire(): boolean {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return true;
    }
    return false;
  }

  release(): void {
    if (this.activeCount > 0) {
      this.activeCount--;
    }

    const next = this.waitQueue.shift();
    if (next !== undefined) {
      this.activeCount++;
      next();
    }
  }
}
