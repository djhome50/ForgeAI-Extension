import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TaskBoard, TaskCreateModal, useTaskBoard } from "."
import type { Task } from "./TaskBoard"

interface TaskBoardViewProps {
	onDone: () => void
}

export function TaskBoardView({ onDone }: TaskBoardViewProps) {
	const { tasks, createTask, updateTaskStatus, overallProgress } = useTaskBoard({
		storageKey: "forgeai-task-board",
	})
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)

	const handleCreateTask = (data: {
		title: string
		description?: string
		priority: "low" | "medium" | "high"
		status: "draft" | "active" | "in_progress" | "review" | "ready" | "merged"
	}) => {
		createTask(data)
	}

	const handleTaskClick = (task: Task) => {
		setSelectedTask(task)
		// Could open task detail modal or navigate to task-specific view
	}

	return (
		<div className="flex flex-col h-full bg-vscode-sideBar-background">
			{/* Header with back button */}
			<div className="flex items-center gap-2 px-4 py-2 border-b border-vscode-panel-border">
				<Button variant="ghost" size="sm" onClick={onDone} className="text-vscode-foreground">
					<ArrowLeft className="size-4 mr-1" />
					Back to Chat
				</Button>
				<div className="flex-1" />
				<span className="text-xs text-vscode-descriptionForeground">
					{overallProgress}% complete
				</span>
			</div>

			{/* Task Board */}
			<TaskBoard
				tasks={tasks}
				onTaskClick={handleTaskClick}
				onStatusChange={updateTaskStatus}
				onCreateTask={() => setShowCreateModal(true)}
			/>

			{/* Create Task Modal */}
			<TaskCreateModal
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onCreate={handleCreateTask}
			/>
		</div>
	)
}

export default TaskBoardView
