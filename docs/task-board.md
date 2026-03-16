# Task Board Guide

The Task Board is ForgeAI's central interface for managing parallel development tasks. It provides a Kanban-style board where you can create, organize, and track multiple tasks running simultaneously.

## 🎯 What is the Task Board?

A visual task management system that:
- **Displays tasks in columns** representing different stages
- **Supports parallel execution** of multiple tasks
- **Integrates with git worktrees** for isolation
- **Provides real-time progress tracking**

## 📋 Task Status Columns

| Column | Description | Typical Actions |
|--------|-------------|-----------------|
| **Draft** | New tasks being planned | Define requirements, assign agent mode |
| **Active** | Task started, agent working | Monitor progress, check worktree |
| **In Progress** | Development in progress | Review changes, provide feedback |
| **Review** | Ready for code review | Check implementation, test |
| **Ready** | Approved for merge | Final checks, prepare merge |
| **Merged** | Completed and merged | Archive, update documentation |

## 🚀 Getting Started

### Opening the Task Board

1. **Command Palette** (`Ctrl/Cmd + Shift + P`)
2. Type "Task Board"
3. Choose display mode:
   - **In Sidebar** - Compact view in activity bar
   - **In Tab** - Full editor tab
   - **In New Window** - Separate VS Code window

### Creating Your First Task

1. Click **"Create Task"** button
2. Fill in task details:
   - **Title**: Clear, descriptive name
   - **Description**: What needs to be done
   - **Priority**: Low/Medium/High
   - **Agent Mode**: Choose appropriate mode
3. Task appears in **Draft** column

## 🎛️ Task Card Features

Each task card displays:

### Basic Information
- **Title** and description
- **Priority badge** (colored by level)
- **Progress percentage**
- **Assigned agent** (if specified)

### Status Indicators
- **Git branch** name (if worktree created)
- **Worktree path** (when active)
- **Agent mode** icon
- **Time tracking** (created, started, completed)

### Actions
- **Click to open** task details
- **Drag between columns** to update status
- **Right-click** for context menu

## 🤖 Agent Mode Selection

Choose how the agent approaches each task:

### When to Use Each Mode

| Mode | Use Case | Example |
|------|----------|---------|
| **Lite** | Quick fixes, simple changes | Fix typo, update comment |
| **Autonomous** | Standard development | Implement feature, refactor |
| **Economy** | Cost-sensitive tasks | Documentation, learning |
| **Power** | Complex problems | Debug tricky issue, architecture |
| **Max** | Full projects | Build complete feature from scratch |

### Changing Agent Mode
1. Select task in Task Board
2. Click **Agent Mode selector** in header
3. Choose new mode
4. Mode applies to current and future tasks

## 🌳 Git Worktree Integration

### Automatic Worktree Creation

When a task moves from **Draft** to **Active**:
1. **Branch created**: `task/{taskId}-{sanitized-title}`
2. **Worktree initialized**: Isolated development environment
3. **VS Code opens**: New window with worktree (optional)

### Worktree Management

| Action | Command | Result |
|--------|---------|--------|
| **Create** | Right-click → "Create Worktree" | Isolated environment |
| **Open** | Click worktree path | Opens in VS Code |
| **Status** | "Check Status" | Shows file changes |
| **Merge** | "Merge Back" | Merges to base branch |

### Worktree Benefits
- **No conflicts** between parallel tasks
- **Clean main branch** always stable
- **Easy context switching** between tasks
- **Independent testing** environments

## 📊 Progress Tracking

### Visual Indicators
- **Progress bar** on each task card
- **Color coding** by status
- **Time tracking** badges
- **Agent assignment** icons

### Overall Progress
- **Header shows** completion percentage
- **Column counts** indicate workflow bottlenecks
- **Priority filtering** helps focus on important tasks

## 🔧 Task Operations

### Creating Tasks
```typescript
// Via UI
Click "Create Task" → Fill form → Save

// Via API (programmatic)
{
  "type": "createTaskBoardTask",
  "taskTitle": "Implement user authentication",
  "taskDescription": "Add login/signup functionality",
  "taskPriority": "high",
  "taskAgentMode": "autonomous"
}
```

### Updating Status
```typescript
// Drag and drop
Drag task from "Draft" to "Active"

// Via API
{
  "type": "updateTaskBoardTaskStatus",
  "taskId": "task-123",
  "taskStatus": "in_progress"
}
```

### Deleting Tasks
```typescript
// Right-click → Delete
// Confirmation required for tasks with worktrees

// Via API
{
  "type": "deleteTaskBoardTask",
  "taskId": "task-123"
}
```

## 🔄 Workflow Examples

### Feature Development Workflow
1. **Draft**: Define requirements, select "Power" mode
2. **Active**: Agent creates worktree, starts implementation
3. **In Progress**: Monitor progress, review commits
4. **Review**: Code review, testing
5. **Ready**: Final approval, prepare merge
6. **Merged**: Merge to main, update documentation

### Bug Fix Workflow
1. **Draft**: Describe bug, select "Lite" mode
2. **Active**: Quick fix in isolated worktree
3. **In Progress**: Test fix, verify solution
4. **Review**: Quick review, confirm fix
5. **Ready**: Merge immediately
6. **Merged**: Deploy fix

### Documentation Workflow
1. **Draft**: Outline docs needed, select "Economy" mode
2. **Active**: Agent writes documentation
3. **In Progress**: Review and edit
4. **Review**: Technical review
5. **Ready**: Final approval
6. **Merged**: Publish documentation

## 📈 Best Practices

### Task Organization
- **Clear titles** that describe the outcome
- **Specific descriptions** with acceptance criteria
- **Appropriate priorities** to guide focus
- **Realistic agent modes** for task complexity

### Parallel Development
- **Independent tasks** in different worktrees
- **Complementary work** (feature + tests + docs)
- **Avoid dependencies** between active tasks
- **Regular status updates** to track progress

### Worktree Management
- **Clean worktrees** - commit changes before merging
- **Descriptive branches** - include task ID and purpose
- **Regular cleanup** - delete merged worktrees
- **Status monitoring** - check for unexpected changes

## 🎛️ Display Modes

### Sidebar Mode
- **Compact view** in activity bar
- **Quick access** while coding
- **Basic task management**
- **Best for**: Active development monitoring

### Tab Mode
- **Full-featured interface**
- **Complete task details**
- **Advanced operations**
- **Best for**: Task planning and review

### Window Mode
- **Dedicated window**
- **Maximum screen space**
- **Focus on task management**
- **Best for**: Project management and coordination

## 🔍 Search and Filtering

### Filter Options
- **By status** - Show specific columns
- **By priority** - Focus on important tasks
- **By agent mode** - Group by execution type
- **By assignee** - Filter by agent assignment

### Search Features
- **Title search** - Find tasks by name
- **Description search** - Search content
- **Tag filtering** - Filter by custom tags
- **Date ranges** - Filter by creation/completion

## ⚙️ Configuration

### Task Board Settings
```json
{
  "defaultAgentMode": "autonomous",
  "autoCreateWorktree": true,
  "showProgressBars": true,
  "compactView": false,
  "refreshInterval": 5000
}
```

### Column Customization
- **Rename columns** to match your workflow
- **Add custom columns** for specific processes
- **Reorder columns** to match flow
- **Hide unused columns** for cleaner view

## 🚨 Troubleshooting

### Common Issues

**Task stuck in "Active"**
- Check if worktree creation failed
- Verify git repository status
- Restart the extension

**Worktree not created**
- Ensure git is initialized
- Check permissions on workspace
- Verify base branch exists

**Merge conflicts**
- Use Merge Agent for resolution
- Check conflict resolution strategies
- Manually resolve if needed

**Performance issues**
- Limit active parallel tasks
- Use appropriate agent modes
- Clear completed tasks regularly

## 📚 Related Documentation

- [Agent Modes Guide](./agent-modes.md) - Understanding mode selection
- [Git Worktrees](./git-worktrees.md) - Task isolation details
- [Merge Agent](./merge-agent.md) - Conflict resolution
- [API Reference](./api.md) - Message types and interfaces
