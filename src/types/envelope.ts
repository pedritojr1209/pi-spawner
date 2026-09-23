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

export type ContextMode = 'isolated' | 'projected' | 'native';

export interface TaskInput {
  taskId: string;
  parentTaskId?: string;
  task: string;
  contextMode: ContextMode;
  context?: {
    decisions?: string[];
    constraints?: string[];
    anchors?: string[];
    transcriptTail?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
  tools?: string[];
  model?: string;
  cwd?: string;
}

export interface TaskResult {
  taskId: string;
  exitCode: number;
  summary: string;
  modifiedFiles: string[];
  completedAt: string;
  error?: string;
}
