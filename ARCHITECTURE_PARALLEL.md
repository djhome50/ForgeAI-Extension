# Parallel Agent Architecture

## Overview

This document describes how ForgeAI implements Replit Agent 4-style parallel task execution with branching, isolation, and merging.

## Core Principles (from Replit Research)

1. **Scope Isolation** - Each sub-agent sees only minimum necessary tools
2. **Task-Based Workflow** - Multiple tasks run in parallel with progress tracking
3. **Automatic Task Splitting** - Large tasks decomposed into smaller pieces
4. **Conflict Resolution** - Specialized agents reconcile merge conflicts
5. **User Visibility** - Real-time progress on Task Board

## Architecture

### 1. Task Isolation via Git Worktrees

```bash
# Each parallel task gets its own worktree
project/
├── main/              # Main branch worktree
├── task-1/            # Task 1 worktree (branch: task/1)
├── task-2/            # Task 2 worktree (branch: task/2)
└── task-3/            # Task 3 worktree (branch: task/3)
```

**Benefits:**
- True file system isolation
- No file locking needed
- Each task can modify same files independently
- Git handles merge at the end

### 2. Multi-Agent Roles

| Agent | Tools | Responsibility |
|-------|-------|----------------|
| **Manager** | decomposition, assignment, tracking | Orchestrates workflow |
| **Editor** | read_file, write_to_file, execute_command | Modifies code |
| **Verifier** | run_tests, lint, screenshot, curl | Validates changes |
| **Merger** | git_merge, conflict_resolve, diff_analysis | Combines branches |

### 3. Task Lifecycle

```
Draft → Active → In Progress → Review → Ready → Merged
  │        │          │           │        │        │
  │        │          │           │        │        └─ Merged to main
  │        │          │           │        └─ Passed verification
  │        │          │           └─ Awaiting verification
  │        │          └─ Agent actively working
  │        └─ Assigned to agent
  └─ User created, not started
```

### 4. Conflict Resolution Strategy

When parallel tasks modify the same file:

```python
# Conflict Detection
def detect_conflicts(task_branches: list[str]) -> list[Conflict]:
    conflicts = []
    for branch_a, branch_b in combinations(task_branches, 2):
        diff_a = git.diff(f"main...{branch_a}")
        diff_b = git.diff(f"main...{branch_b}")
        if overlaps(diff_a, diff_b):
            conflicts.append(Conflict(branch_a, branch_b, diff_a, diff_b))
    return conflicts

# Conflict Resolution via LLM
def resolve_conflict(conflict: Conflict) -> Resolution:
    prompt = f"""
    Two parallel tasks modified the same code:
    
    Task A ({conflict.branch_a}):
    {conflict.diff_a}
    
    Task B ({conflict.branch_b}):
    {conflict.diff_b}
    
    Generate a merged version that preserves both changes.
    """
    return llm.generate(prompt)
```

### 5. Task Board UI

```tsx
// React component for Kanban-style task board
const TaskBoard = () => {
  const columns = [
    { id: 'draft', title: 'Draft', tasks: [] },
    { id: 'active', title: 'Active', tasks: [] },
    { id: 'in_progress', title: 'In Progress', tasks: [] },
    { id: 'review', title: 'Review', tasks: [] },
    { id: 'ready', title: 'Ready', tasks: [] },
    { id: 'merged', title: 'Merged', tasks: [] },
  ]
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map(col => (
          <Droppable key={col.id} droppableId={col.id}>
            <Column {...col} />
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
```

## Implementation Phases

### Phase 1: Task Board UI (Week 1)
- [ ] Create TaskBoard.tsx component
- [ ] Add task creation modal
- [ ] Implement drag-and-drop between columns
- [ ] Connect to backend WebSocket for real-time updates

### Phase 2: Git Worktree Integration (Week 2)
- [ ] Add worktree management to backend
- [ ] Create task branch naming convention
- [ ] Implement branch cleanup after merge

### Phase 3: Parallel Execution Engine (Week 3)
- [ ] Extend LangGraph with parallel nodes
- [ ] Add task assignment logic
- [ ] Implement progress tracking

### Phase 4: Merge Agent (Week 4)
- [ ] Create conflict detection service
- [ ] Build LLM-based conflict resolver
- [ ] Add merge verification

## Agent Modes (Replit-Inspired)

| Mode | Speed | Cost | Capability | Use Case |
|------|-------|------|------------|----------|
| **Lite** | ⚡ Fast | $ | Basic | Quick fixes, small changes |
| **Autonomous** | 🚀 Medium | $$ | Standard | Normal development |
| **Economy** | 🐢 Slow | $ | Optimized | Cost-sensitive tasks |
| **Power** | 💪 Fast | $$$ | Advanced | Complex features |
| **Max** | 🔄 Long-running | $$$$ | Hands-off | Extended autonomous building |

## Settings Schema Extension

```typescript
const forgeaiSchema = baseProviderSettingsSchema.extend({
  // ... existing settings ...
  
  // Parallel execution
  forgeaiParallelExecution: z.boolean().optional().default(false),
  forgeaiMaxParallelTasks: z.number().min(1).max(10).optional().default(3),
  
  // Agent mode
  forgeaiAgentMode: z.enum([
    "lite",
    "autonomous", 
    "economy",
    "power",
    "max"
  ]).optional().default("autonomous"),
  
  // Task board
  forgeaiTaskBoard: z.boolean().optional().default(true),
  forgeaiAutoMerge: z.boolean().optional().default(false),
})
```

## API Endpoints

### Task Management
```
POST   /api/v1/tasks              # Create new task
GET    /api/v1/tasks              # List all tasks
PATCH  /api/v1/tasks/:id          # Update task status
DELETE /api/v1/tasks/:id          # Cancel task
```

### Parallel Execution
```
POST   /api/v1/tasks/:id/start    # Start task in worktree
POST   /api/v1/tasks/:id/merge    # Merge task branch
POST   /api/v1/tasks/merge-all    # Merge all ready tasks
```

### WebSocket Events
```
task:created      # New task added
task:started      # Task execution began
task:progress     # Progress update
task:completed    # Task finished
task:merged       # Task merged to main
conflict:detected # Merge conflict found
conflict:resolved # Conflict resolved
```

## Database Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, in_progress, review, ready, merged
  branch_name TEXT,
  worktree_path TEXT,
  assigned_agent TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  merged_at TIMESTAMP,
  parent_task_id UUID REFERENCES tasks(id), -- for subtasks
  metadata JSONB
);

CREATE TABLE task_conflicts (
  id UUID PRIMARY KEY,
  task_a_id UUID REFERENCES tasks(id),
  task_b_id UUID REFERENCES tasks(id),
  file_path TEXT NOT NULL,
  conflict_type TEXT, -- modify_modify, modify_delete, etc.
  resolution TEXT,
  resolved_at TIMESTAMP,
  resolved_by TEXT -- 'llm' or 'user'
);
```

## Example Workflow

```bash
# 1. User creates parallel tasks
POST /api/v1/tasks
{
  "title": "Add authentication",
  "description": "Implement OAuth2 login",
  "parallel": true
}

POST /api/v1/tasks
{
  "title": "Add dark mode",
  "description": "Implement theme switcher",
  "parallel": true
}

# 2. Backend creates worktrees
git worktree add ../task-1 task/1
git worktree add ../task-2 task/2

# 3. Agents work in parallel
Agent 1 → task-1/ (authentication)
Agent 2 → task-2/ (dark mode)

# 4. Tasks complete, ready for merge
PATCH /api/v1/tasks/1 { "status": "ready" }
PATCH /api/v1/tasks/2 { "status": "ready" }

# 5. Merge agent combines
POST /api/v1/tasks/merge-all
{
  "strategy": "rebase",
  "conflict_resolution": "llm"
}

# 6. Cleanup
git worktree remove ../task-1
git worktree remove ../task-2
git branch -D task/1 task/2
```

## Key Differences from Replit

| Aspect | Replit Agent 4 | ForgeAI |
|--------|---------------|---------|
| **Environment** | Cloud-based Replit | Local VS Code + Backend |
| **Isolation** | Container per task | Git worktree per task |
| **Merge** | Automatic with sub-agents | LLM-assisted with user approval |
| **Visibility** | Real-time dashboard | VS Code sidebar + WebSocket |
| **Cost Model** | Subscription tiers | BYOK + Platform option |

## References

- Replit Agent 4 Blog: https://blog.replit.com/introducing-agent-4-built-for-creativity
- ZenML Case Study: https://www.zenml.io/llmops-database/building-a-production-ready-multi-agent-coding-assistant
- Roo Code Boomerang Tasks: https://docs.roocode.com/features/boomerang-tasks
