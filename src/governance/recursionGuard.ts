export class MaxDepthExceeded extends Error {
  constructor(message?: string) {
    super(message ?? 'Maximum recursion depth exceeded');
    this.name = 'MaxDepthExceeded';
  }
}

export const DEFAULT_MAX_DEPTH = 3;
export const DEPTH_ENV_VAR = 'PI_SPAWNER_DEPTH';

export function getCurrentDepth(): number {
  const raw = process.env[DEPTH_ENV_VAR];
  if (raw === undefined) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export interface RecursionGuardOptions {
  maxDepth?: number;
  parentTaskIds?: string[];
}

export class RecursionGuard {
  private maxDepth: number;

  constructor(options: RecursionGuardOptions = {}) {
    this.maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  }

  checkDepth(depth: number): void {
    if (depth >= this.maxDepth) {
      throw new MaxDepthExceeded(`Depth ${depth} exceeds maximum of ${this.maxDepth}`);
    }
  }

  checkCurrent(): void {
    this.checkDepth(getCurrentDepth());
  }

  detectCycle(parentTaskId: string, ancestryHistory: string[]): boolean {
    return ancestryHistory.some((ancestor) => ancestor === parentTaskId);
  }

  buildChildEnv(): Record<string, string> {
    const current = getCurrentDepth();
    return {
      [DEPTH_ENV_VAR]: String(current + 1),
    };
  }
}
