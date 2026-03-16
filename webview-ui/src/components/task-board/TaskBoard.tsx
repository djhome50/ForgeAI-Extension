import { cn } from "@/lib/utils"
import { t } from "i18next"
import { Plus, GitBranch, Clock, CheckCircle2, AlertCircle, Loader2, Merge, Play, FileCode } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/**
 * Task status following the lifecycle from ARCHITECTURE_PARALLEL.md
 * Draft → Active → In Progress → Review → Ready → Merged
 */
export type TaskStatus = "draft" | "active" | "in_progress" | "review" | "ready" | "merged"

export type TaskPriority = "low" | "medium" | "high"

export interface Task {
	id: string
	title: string
	description?: string
	status: TaskStatus
	priority: TaskPriority
	branchName?: string
	worktreePath?: string
	assignedAgent?: "architect" | "code" | "debug" | "deploy" | "orchestrator"
	createdAt: Date
	startedAt?: Date
	completedAt?: Date
	mergedAt?: Date
	parentTaskId?: string
	subtasks?: Task[]
	progress?: number // 0-100
}

export interface TaskColumn {
	id: TaskStatus
	title: string
	icon: React.ReactNode
	color: string
}

const columns: TaskColumn[] = [
	{ id: "draft", title: t("taskBoard.columns.draft", "Draft"), icon: <FileCode className="size-4" />, color: "text-vscode-descriptionForeground" },
	{ id: "active", title: t("taskBoard.columns.active", "Active"), icon: <Play className="size-4" />, color: "text-vscode-charts-blue" },
	{ id: "in_progress", title: t("taskBoard.columns.inProgress", "In Progress"), icon: <Loader2 className="size-4 animate-spin" />, color: "text-vscode-charts-yellow" },
	{ id: "review", title: t("taskBoard.columns.review", "Review"), icon: <AlertCircle className="size-4" />, color: "text-vscode-charts-orange" },
	{ id: "ready", title: t("taskBoard.columns.ready", "Ready"), icon: <CheckCircle2 className="size-4" />, color: "text-vscode-charts-green" },
	{ id: "merged", title: t("taskBoard.columns.merged", "Merged"), icon: <Merge className="size-4" />, color: "text-vscode-charts-purple" },
]

interface TaskCardProps {
	task: Task
	onClick?: (task: Task) => void
	onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
}

function TaskCard({ task, onClick, onStatusChange }: TaskCardProps) {
	const priorityColors = {
		low: "bg-vscode-charts-green/20 text-vscode-charts-green border-vscode-charts-green/30",
		medium: "bg-vscode-charts-yellow/20 text-vscode-charts-yellow border-vscode-charts-yellow/30",
		high: "bg-vscode-charts-red/20 text-vscode-charts-red border-vscode-charts-red/30",
	}

	const agentColors = {
		architect: "text-vscode-charts-purple",
		code: "text-vscode-charts-blue",
		debug: "text-vscode-charts-orange",
		deploy: "text-vscode-charts-green",
		orchestrator: "text-vscode-charts-yellow",
	}

	return (
		<div
			className={cn(
				"group bg-vscode-editor-background border border-vscode-panel-border rounded-md p-3 cursor-pointer",
				"hover:border-vscode-focusBorder hover:bg-vscode-list-hoverBackground transition-colors",
				"min-h-[80px] flex flex-col gap-2"
			)}
			onClick={() => onClick?.(task)}
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData("taskId", task.id)
				e.dataTransfer.effectAllowed = "move"
			}}>
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<h4 className="text-sm font-medium text-vscode-foreground line-clamp-2 flex-1">
					{task.title}
				</h4>
				<Badge variant="outline" className={cn("text-xs shrink-0", priorityColors[task.priority])}>
					{task.priority}
				</Badge>
			</div>

			{/* Description */}
			{task.description && (
				<p className="text-xs text-vscode-descriptionForeground line-clamp-2">
					{task.description}
				</p>
			)}

			{/* Footer */}
			<div className="flex items-center justify-between mt-auto pt-1">
				<div className="flex items-center gap-2 text-xs text-vscode-descriptionForeground">
					{task.branchName && (
						<span className="flex items-center gap-1">
							<GitBranch className="size-3" />
							{task.branchName}
						</span>
					)}
					{task.assignedAgent && (
						<span className={cn("capitalize", agentColors[task.assignedAgent])}>
							{task.assignedAgent}
						</span>
					)}
				</div>
				{task.progress !== undefined && task.progress < 100 && (
					<span className="text-xs text-vscode-descriptionForeground">
						{task.progress}%
					</span>
				)}
			</div>

			{/* Progress bar */}
			{task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
				<div className="w-full h-1 bg-vscode-progressBar-background rounded-full overflow-hidden">
					<div
						className="h-full bg-vscode-progressBar-foreground transition-all duration-300"
						style={{ width: `${task.progress}%` }}
					/>
				</div>
			)}
		</div>
	)
}

interface TaskColumnProps {
	column: TaskColumn
	tasks: Task[]
	onTaskClick?: (task: Task) => void
	onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
	onDrop?: (taskId: string, status: TaskStatus) => void
}

function TaskColumnComponent({ column, tasks, onTaskClick, onStatusChange, onDrop }: TaskColumnProps) {
	const [isDragOver, setIsDragOver] = useState(false)

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"
		setIsDragOver(true)
	}

	const handleDragLeave = () => {
		setIsDragOver(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
		const taskId = e.dataTransfer.getData("taskId")
		if (taskId && onDrop) {
			onDrop(taskId, column.id)
		}
	}

	return (
		<div
			className={cn(
				"flex flex-col min-w-[200px] max-w-[280px] flex-1 bg-vscode-sideBar-background rounded-lg",
				isDragOver && "ring-2 ring-vscode-focusBorder"
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}>
			{/* Column Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-vscode-panel-border">
				<div className={cn("flex items-center gap-2", column.color)}>
					{column.icon}
					<span className="text-sm font-medium">{column.title}</span>
				</div>
				<Badge variant="secondary" className="text-xs">
					{tasks.length}
				</Badge>
			</div>

			{/* Task List */}
			<div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] max-h-[400px]">
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
						onClick={onTaskClick}
						onStatusChange={onStatusChange}
					/>
				))}
				{tasks.length === 0 && (
					<div className="flex items-center justify-center h-20 text-xs text-vscode-descriptionForeground">
						{t("taskBoard.empty", "No tasks")}
					</div>
				)}
			</div>
		</div>
	)
}

interface TaskBoardProps {
	tasks: Task[]
	onTaskClick?: (task: Task) => void
	onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
	onCreateTask?: () => void
}

export function TaskBoard({ tasks, onTaskClick, onStatusChange, onCreateTask }: TaskBoardProps) {
	// Group tasks by status
	const tasksByColumn = useMemo(() => {
		const grouped: Record<TaskStatus, Task[]> = {
			draft: [],
			active: [],
			in_progress: [],
			review: [],
			ready: [],
			merged: [],
		}
		for (const task of tasks) {
			grouped[task.status].push(task)
		}
		return grouped
	}, [tasks])

	// Calculate overall progress
	const totalTasks = tasks.length
	const completedTasks = tasks.filter((t) => t.status === "merged").length
	const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-vscode-panel-border">
				<div className="flex items-center gap-3">
					<h3 className="text-lg font-semibold text-vscode-foreground">
						{t("taskBoard.title", "Task Board")}
					</h3>
					<Badge variant="outline" className="text-xs">
						{completedTasks}/{totalTasks} {t("taskBoard.completed", "completed")}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					{/* Overall Progress */}
					{totalTasks > 0 && (
						<div className="flex items-center gap-2 text-xs text-vscode-descriptionForeground">
							<Clock className="size-3" />
							<span>{progress}%</span>
							<div className="w-20 h-1.5 bg-vscode-progressBar-background rounded-full overflow-hidden">
								<div
									className="h-full bg-vscode-progressBar-foreground transition-all"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}
					<Button variant="outline" size="sm" onClick={onCreateTask}>
						<Plus className="size-4 mr-1" />
						{t("taskBoard.newTask", "New Task")}
					</Button>
				</div>
			</div>

			{/* Kanban Board */}
			<div className="flex-1 overflow-x-auto p-4">
				<div className="flex gap-4 h-full">
					{columns.map((column) => (
						<TaskColumnComponent
							key={column.id}
							column={column}
							tasks={tasksByColumn[column.id]}
							onTaskClick={onTaskClick}
							onStatusChange={onStatusChange}
							onDrop={onStatusChange}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

export default TaskBoard
