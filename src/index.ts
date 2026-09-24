import { Ingress } from './ingress/index.js';
import { Dispatcher, MaxRecursionDepthExceeded } from './core/dispatcher.js';
import { getRuntimeDriver, getAvailableRuntimes } from './runtimes/index.js';
import { getSurfaceDriver, getAvailableSurfaces } from './surfaces/index.js';
import { Mailbox } from './ipc/mailbox.js';
import { AgentDiscovery } from './ingress/discovery.js';
import { RecursionGuard } from './governance/index.js';
import { PathGuard } from './interceptors/pathGuard.js';
import { ToolFilter } from './interceptors/toolFilter.js';
import { projectContext } from './ipc/contextProjection.js';

export {
  Ingress,
  Dispatcher,
  MaxRecursionDepthExceeded,
  getRuntimeDriver,
  getAvailableRuntimes,
  getSurfaceDriver,
  getAvailableSurfaces,
  Mailbox,
  AgentDiscovery,
  RecursionGuard,
  PathGuard,
  ToolFilter,
  projectContext,
};

export default function (pi: any) {
  pi.registerCommand('/agent', async (input: string) => {
    return await Ingress.handleSlashCommand(input);
  });

  pi.registerTool('subagent', {
    description: 'Dispatch a subagent task',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Agent name' },
        task: { type: 'string', description: 'Task description' },
      },
      required: ['name', 'task'],
    },
    execute: async (args: { name: string; task: string }) => {
      return await Ingress.handleSubagentTool(args.name, args.task);
    },
  });
}
