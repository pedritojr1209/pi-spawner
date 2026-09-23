# SPEC: Extensible Pi Sub-Agents Architecture

## 1. Problem Statement
Developers building multi-agent workflows in local coding environments (such as Pi on Windows/PowerShell) face a false choice: monolithic agent wrappers that blow up memory and context windows, or tightly coupled extensions that can only spawn one type of agent in one fixed interface. 

Current implementations (e.g., `amosblomqvist/pi-subagents` and early WezTerm scripts) suffer from three critical coupling defects:
1. **Invocation Coupling:** Subagents can only be dispatched via an internal LLM tool call, not directly by a human via terminal slash commands.
2. **Surface Coupling:** Execution is hardcoded either to an invisible headless process or a rigid terminal split-pane command.
3. **Runtime Coupling:** The system assumes every subagent runs the same Pi binary with identical system configurations, preventing the use of specialized CLIs (e.g., Claude Code, Aider, or native PowerShell workers) or tiered models.

On resource-constrained hardware (e.g., 8GB RAM, older AVX-only CPUs), unmanaged sub-agent recursion risks spawning fork-bombs and token burn that lock up the operating system.

---

## 2. Solution / Orthogonal Dimensions
Build an extensible, micro-kernel Pi extension with strict **Separation of Concerns (SoC)** that decouples:
* **The Ingress:** Direct human slash commands (`/agent`) and autonomous model tool calls (`subagent()`).
* **The Surface Driver:** Where the subagent renders (WezTerm Split Pane, WezTerm Tab, External OS Window, or Headless Child Process).
* **The Runtime Adapter:** What executable runs (Pi subagent, Claude Code, Aider, or native PowerShell workers).
* **The IPC Mailbox:** An asynchronous, file-based JSON envelope transport (`.pi/handoffs/<taskId>/`) that requires zero networking ports or long-running daemons.
* **The Context Policy:** Defines the context projection spectrum for subagent input directives: isolated, projected, or native.

### Context Projection Spectrum
The context policy describes how structured input directives flow from parent to child:
* **`isolated`** (MVP Baseline): Fresh context; zero parent conversational residue. Default across all runtimes.
* **`projected`** (Universal Transfer): High-signal distillation (decisions, constraints, anchors) injected as a standard Markdown preamble into the prompt. Multi-CLI compatible.
* **`native`** (Deferred): Native session file cloning. Pi-only.

The architecture enforces deterministic governance: schema-level tool whitelisting, canonical path-traversal blocking, environment-variable recursion bounds (`depth <= 2`), and a 3-tier cascading model resolution hierarchy.

---

## 3. User Stories

### Ingress & Invocation
* **US-01:** As a developer, I want to type `/agent scout "Find all auth routes"` in my Pi chat so that a specialized subagent launches without requiring the primary LLM to decide to call a tool.
* **US-02:** As a developer, I want to type `/agent` with no arguments to see an interactive terminal picker of all available agents and their capabilities so that I do not need to memorize agent names.
* **US-03:** As an orchestrator LLM, I want to invoke the `subagent` tool so that I can delegate a focused subtask to a specialist and wait for the result.
* **US-04:** As a developer running an interactive slash command, I want my primary chat session to remain non-blocking so that I can continue typing while the subagent runs in its pane.

### Workspace & Surface Rendering
* **US-05:** As a WezTerm user on Windows, I want subagents to spawn in an automatic split-pane or new tab via `wezterm cli` so that I can monitor progress in real-time.
* **US-06:** As a developer in an unsupported terminal environment, I want the system to silently degrade to a headless background process so that subagents still function without crashing.
* **US-07:** As a developer triaging errors, I want panes running failing subagents (`exitCode !== 0`) to remain open so that I can inspect the terminal stack trace before closing.
* **US-08:** As a developer whose subagent completes cleanly (`exitCode === 0`), I want the pane to close automatically so that my workspace does not clutter.

### Runtime & Model Heterogeneity
* **US-09:** As a developer, I want my subagents to inherit the active session model of the parent Pi instance by default so that I do not encounter missing API key errors.
* **US-10:** As a developer, I want to override a subagent's model in its frontmatter (e.g., `model: claude-3-5-haiku` for `scout.md`) so that lightweight tasks do not burn expensive tokens.
* **US-11:** As a developer, I want to override the model at runtime via a flag (`/agent worker "task" --model=deepseek`) so that I can experiment on the fly.
* **US-12:** As a developer, I want to assign different runtimes (e.g., `runtime: claude` or `runtime: pwsh`) to specific agents so that I can run third-party CLIs within the same orchestration loop.

### Governance, Safety & Limits
* **US-13:** As a host operator with 8GB RAM, I want recursive subagent spawning strictly capped at `depth <= 2` via inherited environment variables so that a runaway agent cannot fork-bomb the OS.
* **US-14:** As a host operator, I want all subagents constrained by a path guardrail that hard-blocks file writes outside the repository root so that agents cannot corrupt system files.
* **US-15:** As a developer, I want headless background subagents killed after 5 minutes of inactivity so that hung processes do not silently drain CPU.
* **US-16:** As an orchestrator LLM, I want subagent responses returned as a structured summary (< 300 words) plus a modified file list so that my primary context window does not suffer token bloat.

---

## 4. Implementation Decisions

### Architectural Planes & Module Boundaries
The extension is partitioned into five distinct, decoupled modules:

```
┌────────────────────────────────────────────────────────┐
│ 1. Ingress Layer: /agent Slash Command & subagent Tool │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Core Dispatcher: Model Cascade, Concurrency & Depth │
└──────┬────────────────────┬────────────────────┬───────┘
       ▼                    ▼                    ▼
┌──────────────┐    ┌───────────────┐    ┌───────────────┐
│ 3. Surfaces  │    │ 4. Runtimes   │    │ 5. Governance │
│ (Pane/Tab/   │    │ (Pi/Claude/   │    │ (PathGuard/   │
│  Headless)   │    │  Pwsh/Aider)  │    │  ToolFilter)  │
└──────────────┘    └───────────────┘    └───────────────┘
```

1. **Ingress Layer (`src/ingress/`):**
   * Exposes two doors to the same dispatch logic: the human interactive command (`/agent`) and the model-facing tool (`subagent`).
   * `/agent` triggers asynchronous, non-blocking execution with a status notification.
   * `subagent()` triggers synchronous, blocking execution that awaits the mailbox envelope.

2. **Core Dispatcher & State Machine (`src/core/`):**
   * **Task Envelope Contract (`src/core/envelope.ts`):** Defines the `TaskInput` and `TaskResult` schemas for mailbox transport.

     ```typescript
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
     ```

     **Note:** Dispatcher coordinates execution; it does not parse or transpile proprietary session formats.
   * **Task Envelope Generation:** Generates a unique task ID (`task-<timestamp>-<rand>`), creates `.pi/handoffs/<taskId>/input.json`, and listens for `result.json`.
   * **Cascading Discovery:** Resolves agent manifests by scanning `./.pi/agents/*.md` first, falling back to `~/.pi/agents/*.md`.
   * **Model Resolution Cascade (Rule 4.4):**
     $$\text{Model} = \text{CLI Flag} \parallel \text{Manifest Frontmatter} \parallel \text{Parent Session Model}$$

     To make this completely bulletproof, we implement a standard 3-tier cascade:

     ```
     ┌─────────────────────────────────────────────────────────────┐
     │ 1. CLI Flag Override: /agent scout "..." --model=deepseek   │ (Highest Priority)
     ├─────────────────────────────────────────────────────────────┤
     │ 2. Frontmatter Override: model: claude-haiku in scout.md   │ (Specialist Default)
     ├─────────────────────────────────────────────────────────────┤
     │ 3. Parent Session Model: Current active model in Pi         │ (Universal Fallback)
     └─────────────────────────────────────────────────────────────┘
     ```

     In the TypeScript dispatcher, this resolves to:

     ```typescript
     const effectiveModel = 
       cliOptions.model || 
       manifest.model || 
       parentSession.getActiveModel();
     ```

   * **Recursion Guard:** Reads and increments `process.env.PI_AGENT_DEPTH`. If `depth > 2`, immediately throws `MaxRecursionDepthExceeded`.
   * **Concurrency Semaphore:** Enforces a maximum of 3 concurrent active agent processes globally to prevent memory paging on 8GB host machines.

3. **Surface Abstraction (`src/surfaces/`):**
   * Implements the `SurfaceDriver` interface: `isAvailable()`, `launch(command, options)`, and `kill()`.
   * `WeztermPaneDriver`: Executes `wezterm cli split-pane` targeting configurable directions/percentages. The driver must capture the integer stdout returned by `wezterm cli split-pane`. On success (`exitCode === 0`), it invokes `wezterm cli kill-pane --pane-id <id>`; on failure, it preserves the pane for user triage.
   * `WeztermTabDriver`: Executes `wezterm cli spawn`.
   * `HeadlessDriver`: Spawns a background Node `child_process` with detached stdio and a 5-minute timeout.
   * **Resilience:** The dispatcher checks `isAvailable()` on the requested surface; if false, it silently degrades to `HeadlessDriver`.

4. **Runtime Abstraction (`src/runtimes/`):**
   * Implements the `RuntimeAdapter` interface: `buildCommand(manifest, taskId, task)`.
   * `PiRuntime`: Spawns `pi` with CLI flags injecting the task ID, model, and filtered tools.
   * `KiloRuntime`: Spawns `kilo` for task execution.
   * `AgyRuntime`: Spawns `agy` (Antigravity CLI).
   * `OpenCodeRuntime`: Spawns `opencode` for task execution.
   * `GenericCliRuntime`: Universal fallback for ANY new CLI via `command_template` in agent frontmatter.
   * `PwshRuntime`: Spawns native `pwsh.exe -File <script>`.
   * **Universal Shim Script:** External CLIs (`kilo`, `agy`, `opencode`) are invoked via a lightweight bootstrap script (`bootstrap.ps1`) that injects the prompt from `input.json`, executes the CLI, and synthesizes `result.json` via Git status upon exit.

5. **Governance & Interceptors (`src/interceptors/`):**
   * `PathGuard`: Intercepts file tools and canonicalizes target paths against `process.cwd()`. Throws an error on path traversal (`..`) or unauthorized drives. On Windows NTFS (case-insensitive), path canonicalization must normalize drive letters and paths (e.g., using `path.resolve()` and case-folding checks) to avoid false permission rejections.
   * `ToolFilter`: Strips forbidden tool declarations from the subagent's registered schema based on the manifest's `tools` array.

6. **IPC Transport (`src/ipc/`):**
   * Uses the file-based Mailbox Pattern under `.pi/handoffs/<taskId>/`.
   * `input.json`: Contains task prompt, model, depth, and allowed tools.
   * `result.json`: Contains exit code, structured summary (< 300 words), modified files, and completion timestamp.
   * Detection uses a hybrid `fs.watch` with a 500ms `setInterval` polling fallback to survive cross-drive and Windows filesystem buffering issues.
   * **Atomic Write Pattern:** Writers must write to `.pi/handoffs/<taskId>/result.json.tmp` and execute an atomic rename (`fs.renameSync`) to `result.json` to prevent Windows `EBUSY` / `EPERM` file-locking collisions with the file watcher.
   * **Orphan Detection:** If a visible pane's process terminates or is closed by the user without producing `result.json`, the task is marked as `ABORTED_BY_USER`.

---

## 5. Testing Decisions & Test Seams

### The Seams (Verification Boundaries)
In accordance with the seam-first testing methodology, testing is anchored at four specific architectural interfaces:

* **Seam 1: Dispatcher Input/Output Seam (Unit/Integration)**
  * *Location:* `Dispatcher.dispatch(request)`
  * *What is verified:* Model cascade precedence, environment variable depth incrementing, semaphore queuing, and fallback when a driver reports `isAvailable() === false`.
* **Seam 2: Mailbox IPC File Watcher Seam (Integration)**
  * *Location:* `Mailbox.awaitResult(taskId)`
  * *What is verified:* Polling and `fs.watch` correctly parse valid `result.json`, trigger timeouts on headless tasks, and survive delayed writes.
* **Seam 3: Governance & Path Interceptor Seam (Security)**
  * *Location:* `PathGuard.validate(targetPath)`
  * *What is verified:* Traversal attacks (`../../Windows/System32`), absolute drive hopping (`D:\`), and valid relative paths within workspace.
* **Seam 4: Surface Command String Seam (Unit)**
  * *Location:* `RuntimeAdapter.buildCommand()` and `SurfaceDriver.buildCommandLine()`
  * *What is verified:* Correct escaping of PowerShell arguments, WezTerm CLI command syntax, and error-sensitive pane flags (`--no-exit` on failure).

### Acceptance Verification Criteria
1. When an agent definition omits `model:`, the subagent process invocation arguments receive the exact model name of the parent session.
2. When a subagent calls `subagent` with `PI_AGENT_DEPTH=2`, the dispatch throws a deterministic error and no process is spawned.
3. When `wezterm` is not in `PATH`, launching an agent with `surface: wezterm-pane` launches headlessly and completes successfully.
4. When a subagent fails with exit code 1 in WezTerm, the pane remains open; when it exits with 0, the pane closes automatically.
5. Calling any file tool targeting a path outside `process.cwd()` throws a hard exception before reaching the OS filesystem.

---

## 6. Out of Scope (Explicitly Deferred)
* **Autonomous Model Debates / Fusion (`/debate`):** Multi-model consensus loops across 3 frontier models are deferred to Phase 3 due to token and latency overhead.
* **Vector Database Context Compaction:** No SQLite-vec or embedding-based memory pruning; compaction remains flat JSONL archiving for the MVP.
* **Persistent Compounding Mental Models (`expertise/*.md`):** Agents do not self-update markdown memory stores without human review.
* **Network Sockets / Cross-Device Mesh:** No HTTP/WebSocket servers running on the host; communication is strictly local filesystem IPC.
* **Docker / Micro-VM Sandboxing:** No Linux containers or virtualization; process isolation relies strictly on OS-level child processes and canonical path guards.
* **Native Session Cloning / Raw Multi-Turn Conversation Thread forking:** Native session cloning and raw multi-turn conversation thread forking across heterogeneous CLIs are deferred to post-MVP; `isolated` is MVP baseline, `projected` planned for Issue #11.

---

## 7. Further Notes & Local Host Constraints
* **Target Host:** Lenovo ThinkCentre M82 (Intel Core i5-3470, 8GB DDR3 RAM, Windows 10 Pro).
* **Terminal Environment:** WezTerm + PowerShell 7.6.5.
* **AVX Limitation:** The host CPU does not support AVX2 instructions; all native Node binaries and CLI tools must operate under standard x86-64/AVX instructions.
* **Disk Cleanliness:** Handoff artifacts under `.pi/handoffs/` should be pruned automatically after task completion (retaining only the last 20 tasks for debugging).

---

## 8. Updated Runtime Suite (Actual CLI Tools)

The following runtime adapters reflect the actual CLI toolchain available for this project:

```
src/runtimes/
├── runtime.interface.ts     # The universal contract
├── piRuntime.ts             # pi subagent (Native)
├── kiloRuntime.ts           # kilo CLI
├── agyRuntime.ts            # Antigravity CLI (agy)
├── openCodeRuntime.ts       # opencode CLI
├── hermesRuntime.ts         # hermes agent (When you plug it in)
└── genericCliRuntime.ts     # Universal fallback for ANY new CLI
```

### Runtime Adapter Implementations

Each adapter is a tiny file (~15 to 20 lines) that knows how that specific binary takes its arguments:

#### 1. Pi Runtime (`src/runtimes/piRuntime.ts`)
```typescript
export class PiRuntime implements RuntimeAdapter {
  id = 'pi';
  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `pi --task-id "${taskId}" "${task}"`;
  }
}
```

#### 2. Kilo Runtime (`src/runtimes/kiloRuntime.ts`)
```typescript
export class KiloRuntime implements RuntimeAdapter {
  id = 'kilo';
  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `kilo run "${task}"`;
  }
}
```

#### 3. Antigravity Runtime (`src/runtimes/agyRuntime.ts`)
```typescript
export class AgyRuntime implements RuntimeAdapter {
  id = 'agy';
  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `agy "${task}"`;
  }
}
```

#### 4. OpenCode Runtime (`src/runtimes/openCodeRuntime.ts`)
```typescript
export class OpenCodeRuntime implements RuntimeAdapter {
  id = 'opencode';
  buildCommand(manifest: AgentManifest, taskId: string, task: string): string {
    return `opencode run "${task}"`;
  }
}
```

#### 5. The "Cheat Code": The Generic CLI Adapter
To make sure you can add *any* future CLI tool (like `hermes` or a random one you find on GitHub tomorrow) without writing TypeScript code, we add a **Generic CLI Runner**:

If you have a new agent markdown file:
```yaml
---
name: hermes-researcher
runtime: custom
command_template: "hermes chat --prompt '{task}'"
surface: wezterm-pane
---
```
The harness simply replaces `{task}` and launches it in WezTerm!

### Daily Life Usage

In your agents folder, you can now specialize your team across your actual tools:

* **`scout.md`**: Uses `runtime: agy` (Antigravity for fast code recon) in a WezTerm bottom split.
* **`coder.md`**: Uses `runtime: pi` or `runtime: kilo` in a side pane.
* **`reviewer.md`**: Uses `runtime: opencode` in a tab.

And from your prompt, you can override it on the fly:
```powershell
/agent scout "Find all database connections" --runtime=agy
/agent refactor "Clean up auth module" --runtime=kilo
```
