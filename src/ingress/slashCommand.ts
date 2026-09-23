export interface ParsedAgentCommand {
  type: 'direct';
  agentName: string;
  task: string;
  cliOptions?: {
    model?: string;
  };
}

export interface ParsedPickerCommand {
  type: 'picker';
}

export type ParsedCommand = ParsedAgentCommand | ParsedPickerCommand;

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (inQuotes) {
      if (char === '\\' && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '"' || next === '\\') {
          current += next;
          i += 2;
          continue;
        }
        current += char;
        i++;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ' ' || char === '\t') {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function parseCliOptions(tokens: string[]): { model?: string } {
  const options: { model?: string } = {};
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '--model') {
      i++;
      if (i < tokens.length && tokens[i] === '=') {
        i++;
      }
      if (i < tokens.length) {
        options.model = tokens[i];
        i++;
      }
    } else if (token.startsWith('--model=')) {
      options.model = token.slice('--model='.length);
      i++;
    } else if (token === '=') {
      i++;
    } else {
      i++;
    }
  }

  return options;
}

export class SlashCommandParser {
  static parse(input: string): ParsedCommand | null {
    const trimmed = input.trim();

    if (!trimmed.startsWith('/agent')) {
      return null;
    }

    const afterPrefix = trimmed.slice('/agent'.length).trim();

    if (afterPrefix.length === 0) {
      return { type: 'picker' };
    }

    const tokens = tokenize(afterPrefix);

    if (tokens.length < 2) {
      return null;
    }

    const agentName = tokens[0];
    const taskToken = tokens[1];

    if (!taskToken || taskToken.startsWith('--')) {
      return null;
    }

    const remaining = tokens.slice(2);
    const cliOptions = parseCliOptions(remaining);

    return {
      type: 'direct',
      agentName,
      task: taskToken,
      cliOptions: Object.keys(cliOptions).length > 0 ? cliOptions : undefined,
    };
  }
}
