import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { AgentManifest } from '../types/agent.js';

export interface DiscoveredAgent extends AgentManifest {
  source: 'local' | 'global';
  filePath: string;
}

export class AgentDiscovery {
  private static readonly LOCAL_DIR = path.join(process.cwd(), '.pi', 'agents');

  private static getGlobalDir(): string {
    return path.join(os.homedir(), '.pi', 'agents');
  }

  private static readManifest(filePath: string): AgentManifest | null {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);
      const data = parsed.data;

      const name = typeof data.name === 'string' ? data.name : null;
      if (!name) {
        return null;
      }

      const asString = (value: unknown, fallback: string) =>
        typeof value === 'string' ? value : fallback;

      const manifest: AgentManifest = {
        name,
        runtime: asString(data.runtime, 'pi'),
        surface: asString(data.surface, 'headless'),
        model: typeof data.model === 'string' ? data.model : undefined,
        tools: Array.isArray(data.tools)
          ? data.tools.filter((t: unknown) => typeof t === 'string')
          : undefined,
        description: typeof data.description === 'string' ? data.description : undefined,
        command_template: typeof data.command_template === 'string' ? data.command_template : undefined,
      };

      return manifest;
    } catch {
      return null;
    }
  }

  private static scanDir(dir: string, source: 'local' | 'global'): DiscoveredAgent[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    const agents: DiscoveredAgent[] = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const manifest = this.readManifest(filePath);
      if (manifest) {
        agents.push({
          ...manifest,
          source,
          filePath,
        });
      }
    }

    return agents;
  }

  static discover(): DiscoveredAgent[] {
    const localAgents = this.scanDir(this.LOCAL_DIR, 'local');
    const globalAgents = this.scanDir(this.getGlobalDir(), 'global');

    const map = new Map<string, DiscoveredAgent>();

    for (const agent of globalAgents) {
      map.set(agent.name, agent);
    }

    for (const agent of localAgents) {
      map.set(agent.name, agent);
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
}
