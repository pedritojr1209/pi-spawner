import path from 'node:path';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class PathGuard {
  private static workspaceRoot: string;

  static {
    this.workspaceRoot = path.normalize(path.resolve(process.cwd()));
  }

  static validate(targetPath: string): void {
    const resolved = path.normalize(path.resolve(process.cwd(), targetPath));
    const workspaceLower = this.workspaceRoot.toLowerCase();
    const resolvedLower = resolved.toLowerCase();

    const isRoot = resolvedLower === workspaceLower;
    const isWithin = resolvedLower.startsWith(workspaceLower + path.sep);

    if (!isRoot && !isWithin) {
      throw new SecurityError('Access outside workspace is denied');
    }
  }
}
