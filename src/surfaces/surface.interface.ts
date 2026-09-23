export interface SurfaceDriver {
  readonly id: string;
  isAvailable(): boolean | Promise<boolean>;
  launch(command: string, options: LaunchOptions): Promise<SurfaceInstance>;
  kill(instance: SurfaceInstance): Promise<void>;
}

export interface LaunchOptions {
  direction?: 'horizontal' | 'vertical';
  size?: number;
  cwd?: string;
  env?: Record<string, string>;
  args?: string[];
}

export interface SurfaceInstance {
  id: string;
  pid: number;
  exitCode: number | null;
  startedAt: Date;
  endedAt: Date | null;
}
