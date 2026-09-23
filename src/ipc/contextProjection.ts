import type { ContextMode } from '../types/envelope.js';

export interface TaskContext {
  decisions?: string[];
  constraints?: string[];
  anchors?: string[];
  transcriptTail?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function formatContextBlock(context?: TaskContext): string {
  const lines: string[] = ['# Task Summary'];

  if (!context) {
    lines.push('');
    lines.push('No additional context provided.');
    return lines.join('\n') + '\n';
  }

  lines.push('');

  if (context.decisions && context.decisions.length > 0) {
    lines.push('## Prior Decisions');
    lines.push('');
    for (const d of context.decisions) {
      lines.push(`- ${d}`);
    }
    lines.push('');
  }

  if (context.constraints && context.constraints.length > 0) {
    lines.push('## Constraints');
    lines.push('');
    for (const c of context.constraints) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  if (context.anchors && context.anchors.length > 0) {
    lines.push('## File Anchors');
    lines.push('');
    for (const a of context.anchors) {
      lines.push(`- ${a}`);
    }
    lines.push('');
  }

  return lines.join('\n') + '\n';
}

export function projectContext(prompt: string, context?: TaskContext, mode?: ContextMode): string {
  if (mode === 'isolated' || mode === 'native' || mode === undefined) {
    return prompt;
  }

  if (mode !== 'projected') {
    return prompt;
  }

  const preamble = formatContextBlock(context);
  return preamble + '\n---\n\n' + prompt;
}
