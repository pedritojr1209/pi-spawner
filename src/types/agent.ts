export interface AgentManifest {
  name: string;
  runtime: string;
  surface: string;
  model?: string;
  tools?: string[];
  description?: string;
  command_template?: string;
}
