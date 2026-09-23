export function escapePrompt(prompt: string): string {
  return `"${prompt.replace(/"/g, '\\"')}"`;
}
