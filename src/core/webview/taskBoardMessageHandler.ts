import * as vscode from "vscode"
import { ClineProvider } from "./ClineProvider"
import { getWorktreeManager, type WorktreeInfo } from "../../services/git-worktree"
import { getMergeAgent, type MergeConflict, type MergeResult } from "../../services/merge-agent"

/**
 * Task Board message handlers
 * 
 * Handles messages from the webview for Task Board operations:
 * - Task CRUD operations
 * - Worktree management per task
 * - Merge operations
 */

export interface TaskBoardTask {
	id: string
	title: string
	description?: string
	priority: "low" | "medium" | "high"
	status: "draft" | "active" | "in_progress" | "review" | "ready" | "merged"
	branchName?: string
	worktreePath?: string
	assignedAgent?: "architect" | "code" | "debug" | "deploy" | "orchestrator"
	agentMode?: "lite" | "autonomous" | "economy" | "power" | "max"
	createdAt: string
	startedAt?: string
	completedAt?: string
	mergedAt?: string
	parentTaskId?: string
	progress?: number
}

const TASK_STORAGE_KEY = "forgeai-task-board-tasks"

/**
 * Get all tasks from storage
 */
async function getTasksFromStorage(provider: ClineProvider): Promise<TaskBoardTask[]> {
	const tasks = await provider.context.globalState.get<TaskBoardTask[]>(TASK_STORAGE_KEY)
	return tasks ?? []
}

/**
 * Save tasks to storage
 */
async function saveTasksToStorage(provider: ClineProvider, tasks: TaskBoardTask[]): Promise<void> {
	await provider.context.globalState.update(TASK_STORAGE_KEY, tasks)
}

/**
 * Handle getTaskBoardTasks message
 */
export async function handleGetTaskBoardTasks(provider: ClineProvider): Promise<{
	tasks: TaskBoardTask[]
	error?: string
}> {
	try {
		const tasks = await getTasksFromStorage(provider)
		return { tasks }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { tasks: [], error: errorMessage }
	}
}

/**
 * Handle createTaskBoardTask message
 */
export async function handleCreateTaskBoardTask(
	provider: ClineProvider,
	params: {
		title: string
		description?: string
		priority: "low" | "medium" | "high"
		status?: "draft" | "active" | "in_progress" | "review" | "ready" | "merged"
		agentMode?: "lite" | "autonomous" | "economy" | "power" | "max"
	}
): Promise<{ task?: TaskBoardTask; error?: string }> {
	try {
		const tasks = await getTasksFromStorage(provider)
		
		const newTask: TaskBoardTask = {
			id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
			title: params.title,
			description: params.description,
			priority: params.priority,
			status: params.status ?? "draft",
			agentMode: params.agentMode,
			createdAt: new Date().toISOString(),
			progress: 0,
		}
		
		tasks.push(newTask)
		await saveTasksToStorage(provider, tasks)
		
		return { task: newTask }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle updateTaskBoardTaskStatus message
 */
export async function handleUpdateTaskBoardTaskStatus(
	provider: ClineProvider,
	taskId: string,
	status: TaskBoardTask["status"]
): Promise<{ task?: TaskBoardTask; error?: string }> {
	try {
		const tasks = await getTasksFromStorage(provider)
		const taskIndex = tasks.findIndex(t => t.id === taskId)
		
		if (taskIndex === -1) {
			return { error: `Task ${taskId} not found` }
		}
		
		const task = tasks[taskIndex]
		task.status = status
		
		// Update timestamps based on status
		if (status === "in_progress" && !task.startedAt) {
			task.startedAt = new Date().toISOString()
		} else if (status === "merged") {
			task.mergedAt = new Date().toISOString()
			task.progress = 100
		} else if (status === "ready") {
			task.completedAt = new Date().toISOString()
			task.progress = 100
		}
		
		tasks[taskIndex] = task
		await saveTasksToStorage(provider, tasks)
		
		return { task }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle deleteTaskBoardTask message
 */
export async function handleDeleteTaskBoardTask(
	provider: ClineProvider,
	taskId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const tasks = await getTasksFromStorage(provider)
		const filteredTasks = tasks.filter(t => t.id !== taskId)
		
		if (filteredTasks.length === tasks.length) {
			return { success: false, error: `Task ${taskId} not found` }
		}
		
		await saveTasksToStorage(provider, filteredTasks)
		return { success: true }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { success: false, error: errorMessage }
	}
}

/**
 * Handle createTaskWorktree message
 * Creates a git worktree for a task
 */
export async function handleCreateTaskWorktree(
	provider: ClineProvider,
	taskId: string,
	taskTitle: string,
	baseBranch?: string
): Promise<{ worktree?: WorktreeInfo; error?: string }> {
	try {
		const workspacePath = getWorkspacePath()
		if (!workspacePath) {
			return { error: "No workspace folder open" }
		}
		
		const worktreeManager = getWorktreeManager(workspacePath)
		await worktreeManager.initialize()
		
		const worktree = await worktreeManager.createWorktree({
			taskId,
			taskTitle,
			baseBranch: baseBranch ?? "main",
			createBranch: true,
		})
		
		// Update task with worktree info
		const tasks = await getTasksFromStorage(provider)
		const taskIndex = tasks.findIndex(t => t.id === taskId)
		if (taskIndex !== -1) {
			tasks[taskIndex].worktreePath = worktree.worktreePath
			tasks[taskIndex].branchName = worktree.branchName
			await saveTasksToStorage(provider, tasks)
		}
		
		return { worktree }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle mergeTaskWorktree message
 * Merges a task's worktree back to base branch
 */
export async function handleMergeTaskWorktree(
	provider: ClineProvider,
	taskId: string,
	options?: {
		targetBranch?: string
		squash?: boolean
		deleteAfterMerge?: boolean
	}
): Promise<{ result?: MergeResult; error?: string }> {
	try {
		const tasks = await getTasksFromStorage(provider)
		const task = tasks.find(t => t.id === taskId)
		
		if (!task) {
			return { error: `Task ${taskId} not found` }
		}
		
		if (!task.worktreePath || !task.branchName) {
			return { error: `Task ${taskId} has no worktree` }
		}
		
		const workspacePath = getWorkspacePath()
		if (!workspacePath) {
			return { error: "No workspace folder open" }
		}
		
		const worktreeManager = getWorktreeManager(workspacePath)
		await worktreeManager.initialize()
		
		const result = await worktreeManager.mergeWorktree({
			taskId,
			targetBranch: options?.targetBranch,
			deleteAfterMerge: options?.deleteAfterMerge ?? true,
			squash: options?.squash ?? false,
		})
		
		if (result.success) {
			// Update task status
			const taskIndex = tasks.findIndex(t => t.id === taskId)
			if (taskIndex !== -1) {
				tasks[taskIndex].status = "merged"
				tasks[taskIndex].mergedAt = new Date().toISOString()
				tasks[taskIndex].progress = 100
				await saveTasksToStorage(provider, tasks)
			}
		}
		
		return { result }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle getTaskWorktreeStatus message
 */
export async function handleGetTaskWorktreeStatus(
	provider: ClineProvider,
	taskId: string
): Promise<{
	status?: {
		modified: number
		added: number
		deleted: number
		untracked: number
		ahead: number
		behind: number
	}
	error?: string
}> {
	try {
		const tasks = await getTasksFromStorage(provider)
		const task = tasks.find(t => t.id === taskId)
		
		if (!task) {
			return { error: `Task ${taskId} not found` }
		}
		
		if (!task.worktreePath) {
			return { error: `Task ${taskId} has no worktree` }
		}
		
		const workspacePath = getWorkspacePath()
		if (!workspacePath) {
			return { error: "No workspace folder open" }
		}
		
		const worktreeManager = getWorktreeManager(workspacePath)
		await worktreeManager.initialize()
		
		const status = await worktreeManager.getWorktreeStatus(taskId)
		return { status }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle resolveMergeConflicts message
 */
export async function handleResolveMergeConflicts(
	provider: ClineProvider,
	taskId: string
): Promise<{
	conflicts?: MergeConflict[]
	autoResolved?: number
	manualRequired?: number
	error?: string
}> {
	try {
		const workspacePath = getWorkspacePath()
		if (!workspacePath) {
			return { error: "No workspace folder open" }
		}
		
		const mergeAgent = getMergeAgent(workspacePath)
		const result = await mergeAgent.autoResolve()
		
		return {
			conflicts: mergeAgent.analyzeAllConflicts(),
			autoResolved: result.resolved,
			manualRequired: result.manual,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { error: errorMessage }
	}
}

/**
 * Handle abortTaskMerge message
 */
export async function handleAbortTaskMerge(
	provider: ClineProvider,
	taskId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const workspacePath = getWorkspacePath()
		if (!workspacePath) {
			return { error: "No workspace folder open" }
		}
		
		const mergeAgent = getMergeAgent(workspacePath)
		await mergeAgent.abortMerge()
		
		return { success: true }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		return { success: false, error: errorMessage }
	}
}

/**
 * Helper to get workspace path
 */
function getWorkspacePath(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders
	if (workspaceFolders && workspaceFolders.length > 0) {
		return workspaceFolders[0].uri.fsPath
	}
	return undefined
}
