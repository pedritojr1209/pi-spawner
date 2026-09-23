export interface TaskInputEnvelope {
  taskId: string;
  agentName: string;
  prompt: string;
  model: string;
  depth: number;
  allowedTools: string[];
  createdAt: string;
}

export interface TaskResultEnvelope {
  taskId: string;
  exitCode: number;
  summary: string;
  modifiedFiles: string[];
  completedAt: string;
  error?: string;
}
