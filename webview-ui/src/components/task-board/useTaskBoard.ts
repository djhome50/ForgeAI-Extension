import { useState, useCallback, useEffect } from "react"
import type { Task, TaskStatus, TaskPriority } from "./TaskBoard"

// Generate unique task ID
const generateTaskId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Generate branch name from task
const generateBranchName = (taskId: string) => `task/${taskId.split("-").pop()}`

export interface UseTaskBoardOptions {
	initialTasks?: Task[]
	onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
	onTaskCreate?: (task: Task) => void
	onTaskDelete?: (taskId: string) => void
	storageKey?: string
}

export function useTaskBoard(options: UseTaskBoardOptions = {}) {
	const { initialTasks = [], onStatusChange, onTaskCreate, onTaskDelete, storageKey } = options

	// Load tasks from storage or use initial
	const [tasks, setTasks] = useState<Task[]>(() => {
		if (storageKey && typeof window !== "undefined") {
			const stored = localStorage.getItem(storageKey)
			if (stored) {
				try {
					return JSON.parse(stored)
				} catch {
					return initialTasks
				}
			}
		}
		return initialTasks
	})

	// Persist to storage
	useEffect(() => {
		if (storageKey && typeof window !== "undefined") {
			localStorage.setItem(storageKey, JSON.stringify(tasks))
		}
	}, [tasks, storageKey])

	// Create new task
	const createTask = useCallback(
		(data: { title: string; description?: string; priority: TaskPriority; status: TaskStatus }) => {
			const newTask: Task = {
				id: generateTaskId(),
				title: data.title,
				description: data.description,
				status: data.status,
				priority: data.priority,
				createdAt: new Date(),
				progress: 0,
			}

			setTasks((prev) => [...prev, newTask])
			onTaskCreate?.(newTask)

			return newTask
		},
		[onTaskCreate],
	)

	// Update task status
	const updateTaskStatus = useCallback(
		(taskId: string, newStatus: TaskStatus) => {
			setTasks((prev) =>
				prev.map((task) => {
					if (task.id !== taskId) return task

					const updates: Partial<Task> = { status: newStatus }

					// Add branch/worktree when moving to active
					if (newStatus === "active" && !task.branchName) {
						updates.branchName = generateBranchName(taskId)
						updates.worktreePath = `../task-${taskId.split("-").pop()}`
						updates.startedAt = new Date()
					}

					// Mark completed when merged
					if (newStatus === "merged") {
						updates.mergedAt = new Date()
						updates.completedAt = new Date()
						updates.progress = 100
					}

					return { ...task, ...updates }
				}),
			)

			onStatusChange?.(taskId, newStatus)
		},
		[onStatusChange],
	)

	// Update task progress
	const updateTaskProgress = useCallback((taskId: string, progress: number) => {
		setTasks((prev) =>
			prev.map((task) =>
				task.id === taskId ? { ...task, progress: Math.min(100, Math.max(0, progress)) } : task,
			),
		)
	}, [])

	// Delete task
	const deleteTask = useCallback(
		(taskId: string) => {
			setTasks((prev) => prev.filter((task) => task.id !== taskId))
			onTaskDelete?.(taskId)
		},
		[onTaskDelete],
	)

	// Get tasks by status
	const getTasksByStatus = useCallback(
		(status: TaskStatus) => tasks.filter((task) => task.status === status),
		[tasks],
	)

	// Get active tasks (for parallel execution)
	const getActiveTasks = useCallback(() => tasks.filter((task) => task.status === "in_progress"), [tasks])

	// Get ready tasks (for merging)
	const getReadyTasks = useCallback(() => tasks.filter((task) => task.status === "ready"), [tasks])

	// Calculate overall progress
	const overallProgress = tasks.length > 0
		? Math.round((tasks.filter((t) => t.status === "merged").length / tasks.length) * 100)
		: 0

	return {
		tasks,
		createTask,
		updateTaskStatus,
		updateTaskProgress,
		deleteTask,
		getTasksByStatus,
		getActiveTasks,
		getReadyTasks,
		overallProgress,
	}
}

export default useTaskBoard
