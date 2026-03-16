# ForgeAI Extension

> Fork of Roo Code with Parallel Agent Architecture

## Overview

ForgeAI Extension extends Roo Code with a **Parallel Agent Architecture** inspired by Replit Agent 4. This enables multiple AI agents to work on independent tasks simultaneously, each in isolated git worktrees.

## Key Features

### 🎯 Task Board

A Kanban-style interface for managing parallel development tasks:

- **6 Status Columns**: Draft → Active → In Progress → Review → Ready → Merged
- **Multiple Display Modes**: Sidebar panel, editor tab, or separate window
- **Progress Tracking**: Visual progress indicators per task
- **Agent Assignment**: Assign tasks to specialized agents (architect, code, debug, deploy)

### 🤖 Agent Modes

Choose how the agent approaches each task:

| Mode | Speed | Cost | Capability | Use Case |
|------|-------|------|------------|----------|
| **Lite** | Fast | Low | Basic | Quick fixes, simple questions |
| **Autonomous** | Medium | Medium | Standard | Feature implementation, refactoring |
| **Economy** | Medium | Low | Standard | Documentation, learning |
| **Power** | Medium | High | Advanced | Complex features, debugging |
| **Max** | Slow | High | Full | Full projects, autonomous development |

### 🌳 Git Worktree Integration

Each task gets its own isolated worktree:

- **Automatic Branch Creation**: `task/{taskId}-{title}`
- **Isolated Development**: No conflicts between parallel tasks
- **Easy Merging**: Merge back to base with conflict detection
- **VS Code Integration**: Open worktree in new window

### 🔀 Merge Agent

Intelligent conflict resolution when merging tasks:

- **Auto-Resolution**: Safe conflicts resolved automatically
- **AI Suggestions**: Confidence-scored resolution proposals
- **Interactive UI**: Manual resolution for complex conflicts
- **Conflict Analysis**: Detects non-overlapping changes

### 📚 Skills Library

Pre-defined templates for common tasks:

- Implement Feature
- Fix Bug
- Add Tests
- Code Review
- Refactor Code
- Create Pull Request
- Write Documentation
- Deploy Service
- Quick Fix
- Full Feature Development

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Extension                       │
├─────────────────────────────────────────────────────────────┤
│  Task Board UI (Webview)                                    │
│  ├── Agent Mode Selector                                    │
│  ├── Task Cards (Kanban)                                    │
│  └── Skills Library                                         │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                           │
│  ├── TaskBoardProvider (Display modes)                      │
│  ├── GitWorktreeManager (Task isolation)                    │
│  └── MergeAgent (Conflict resolution)                       │
├─────────────────────────────────────────────────────────────┤
│  ForgeAI Backend (Optional)                                 │
│  └── Cloud mode for remote agent execution                  │
└─────────────────────────────────────────────────────────────┘
```

## Workflow

1. **Create Task** → Add to Task Board
2. **Select Mode** → Choose agent behavior
3. **Create Worktree** → Isolated development environment
4. **Work on Task** → Agent executes in worktree
5. **Review Changes** → Check worktree status
6. **Merge Back** → Resolve conflicts, merge to base
7. **Complete** → Task marked as merged

## Commands

| Command | Description |
|---------|-------------|
| `Open Task Board` | Open Task Board in current view |
| `Open Task Board in Tab` | Open as editor tab |
| `Open Task Board in Sidebar` | Open in sidebar panel |
| `Open Task Board in New Window` | Open in separate window |

## Message Types

### Webview → Extension

- `getTaskBoardTasks` - Fetch all tasks
- `createTaskBoardTask` - Create new task
- `updateTaskBoardTaskStatus` - Update task status
- `deleteTaskBoardTask` - Delete task
- `createTaskWorktree` - Create worktree for task
- `mergeTaskWorktree` - Merge task worktree
- `getTaskWorktreeStatus` - Get worktree file status
- `resolveMergeConflicts` - Auto-resolve conflicts
- `abortTaskMerge` - Abort merge operation

### Extension → Webview

- `taskBoardTasks` - Task list response
- `taskBoardTaskCreated` - Task created confirmation
- `taskBoardTaskUpdated` - Task updated confirmation
- `taskBoardTaskDeleted` - Task deleted confirmation
- `taskWorktreeCreated` - Worktree created response
- `taskWorktreeMerged` - Merge result
- `taskWorktreeStatus` - File status response
- `mergeResolved` - Conflict resolution result

## Development

### Build

```bash
pnpm install
pnpm build
```

### Type Check

```bash
pnpm check-types
```

### Test

```bash
pnpm test
```

## File Structure

```
src/
├── services/
│   ├── task-board/
│   │   └── TaskBoardProvider.ts      # Display mode management
│   ├── git-worktree/
│   │   └── GitWorktreeManager.ts     # Worktree operations
│   └── merge-agent/
│       └── MergeAgent.ts             # Conflict resolution
├── core/
│   └── webview/
│       └── taskBoardMessageHandler.ts # Message routing
└── activate/
    └── registerCommands.ts           # Command registration

webview-ui/src/components/
├── task-board/
│   ├── TaskBoard.tsx                 # Kanban board
│   ├── TaskBoardView.tsx             # Full-screen view
│   └── useTaskBoard.ts               # State management
├── agent-mode/
│   └── AgentModeSelector.tsx         # Mode selection
└── skills/
    └── SkillsLibrary.tsx             # Template library
```

## Configuration

### Agent Mode Settings

Each mode can be configured with different:
- Model selection (speed vs capability)
- Token limits
- Auto-approval thresholds
- Context window size

### Worktree Settings

- Base branch (default: `main`)
- Worktree directory location
- Branch naming convention
- Auto-delete after merge

## Comparison with Roo Code

| Feature | Roo Code | ForgeAI Extension |
|---------|----------|-------------------|
| Sequential Tasks | ✅ | ✅ |
| Parallel Tasks | ❌ | ✅ |
| Task Board UI | ❌ | ✅ |
| Git Worktrees | ❌ | ✅ |
| Agent Modes | ❌ | ✅ |
| Skills Library | ❌ | ✅ |
| Merge Agent | ❌ | ✅ |
| Cloud Backend | ❌ | ✅ (ForgeAI) |

## Credits

Based on [Roo Code](https://github.com/RooCodeInc/Roo-Code) by Roo Veterinary Inc.

Parallel Agent Architecture inspired by [Replit Agent 4](https://replit.com).

## License

Same as Roo Code (check original repository for details).
