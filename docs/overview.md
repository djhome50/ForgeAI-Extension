# ForgeAI Extension Overview

ForgeAI Extension is a fork of Roo Code enhanced with a **Parallel Agent Architecture** inspired by Replit Agent 4. It enables multiple AI agents to work on independent tasks simultaneously, each in isolated git worktrees.

## 🎯 What Makes ForgeAI Different

### Parallel Task Execution
Unlike traditional AI assistants that work sequentially, ForgeAI allows multiple agents to work on different tasks at the same time, dramatically increasing development velocity.

### Intelligent Task Isolation
Each task gets its own git worktree, ensuring parallel development never conflicts. The Merge Agent handles conflict resolution automatically when merging back.

### Agent Mode Selection
Choose how the agent approaches each task with different speed, cost, and capability tradeoffs.

## 🚀 Key Features

### Task Board
- **Kanban-style interface** for managing development tasks
- **6 status columns**: Draft → Active → In Progress → Review → Ready → Merged
- **Multiple display modes**: Sidebar, tab, or separate window
- **Visual progress tracking** and agent assignment

### Agent Modes
| Mode | Speed | Cost | Capability | Best For |
|------|-------|------|------------|----------|
| **Lite** | Fast | Low | Basic | Quick fixes, simple questions |
| **Autonomous** | Medium | Medium | Standard | Feature implementation, refactoring |
| **Economy** | Medium | Low | Standard | Documentation, learning |
| **Power** | Medium | High | Advanced | Complex features, debugging |
| **Max** | Slow | High | Full | Full projects, autonomous development |

### Git Worktree Integration
- **Automatic branch creation** for each task
- **Isolated development environments** prevent conflicts
- **Easy merging** back to base branch
- **VS Code integration** for seamless workflow

### Merge Agent
- **Intelligent conflict detection** and analysis
- **Auto-resolution** for safe conflicts
- **AI-assisted suggestions** for complex conflicts
- **Interactive resolution UI** when manual intervention needed

### Skills Library
- **10 pre-defined templates** for common tasks
- **Variable substitution** for customization
- **Recommended agent modes** per skill
- **Estimated completion times**

## 🏗️ Architecture Overview

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

## 🔄 Workflow

1. **Create Task** - Add task to Task Board with title and priority
2. **Select Agent Mode** - Choose appropriate mode for the task
3. **Create Worktree** - Isolated git worktree for parallel development
4. **Execute Task** - Agent works in isolation without affecting other tasks
5. **Review Progress** - Monitor task status and worktree changes
6. **Merge Back** - Resolve conflicts and merge to base branch
7. **Complete** - Task marked as merged and ready for production

## 🆚 ForgeAI vs Roo Code

| Feature | Roo Code | ForgeAI Extension |
|---------|----------|-------------------|
| Sequential Tasks | ✅ | ✅ |
| **Parallel Tasks** | ❌ | ✅ |
| **Task Board UI** | ❌ | ✅ |
| **Git Worktrees** | ❌ | ✅ |
| **Agent Modes** | ❌ | ✅ |
| **Skills Library** | ❌ | ✅ |
| **Merge Agent** | ❌ | ✅ |
| **Cloud Backend** | ❌ | ✅ (ForgeAI) |

## 🎯 Use Cases

### Individual Developers
- **Feature branching** without context switching
- **Parallel debugging** of multiple issues
- **Documentation updates** alongside feature work

### Teams
- **Multiple developers** working on different features
- **Code reviews** in isolated environments
- **Testing** different approaches simultaneously

### Complex Projects
- **Large refactors** broken into parallel tasks
- **Multi-component development** with dependencies
- **Research and prototyping** alongside production work

## 📊 Benefits

### Increased Velocity
- **Parallel execution** reduces total development time
- **No context switching** between tasks
- **Automated conflict resolution** saves manual effort

### Better Organization
- **Visual task tracking** with Kanban board
- **Clear task boundaries** with git isolation
- **Progress visibility** for all stakeholders

### Reduced Risk
- **Isolated development** prevents breaking main branch
- **Intelligent merging** handles conflicts automatically
- **Task-specific agent modes** optimize for each use case

## 🔧 Getting Started

1. **Install ForgeAI Extension** from VS Code Marketplace
2. **Open Task Board** using command palette
3. **Create your first task** and select an agent mode
4. **Let the agent work** in the isolated worktree
5. **Review and merge** when complete

## 📚 Next Steps

- [Task Board Guide](./task-board.md) - Learn to use the Kanban interface
- [Agent Modes](./agent-modes.md) - Understand mode selection
- [Git Worktrees](./git-worktrees.md) - Master task isolation
- [Development Setup](./development.md) - Start contributing

## 🤝 Contributing

ForgeAI is open source and welcomes contributions! See the [Contributing Guide](./contributing.md) for details on how to get started.

---

*Based on Roo Code by Roo Veterinary Inc., enhanced with Parallel Agent Architecture inspired by Replit Agent 4.*
