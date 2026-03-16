import { cn } from "@/lib/utils"
import { t } from "i18next"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { TaskPriority, TaskStatus } from "./TaskBoard"

interface TaskCreateModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreate: (task: {
		title: string
		description?: string
		priority: TaskPriority
		status: TaskStatus
	}) => void
}

export function TaskCreateModal({ open, onOpenChange, onCreate }: TaskCreateModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [priority, setPriority] = useState<TaskPriority>("medium")
	const [status, setStatus] = useState<TaskStatus>("draft")

	const handleCreate = () => {
		if (!title.trim()) return

		onCreate({
			title: title.trim(),
			description: description.trim() || undefined,
			priority,
			status,
		})

		// Reset form
		setTitle("")
		setDescription("")
		setPriority("medium")
		setStatus("draft")
		onOpenChange(false)
	}

	const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
		{ value: "low", label: t("taskBoard.priority.low", "Low"), color: "text-vscode-charts-green" },
		{ value: "medium", label: t("taskBoard.priority.medium", "Medium"), color: "text-vscode-charts-yellow" },
		{ value: "high", label: t("taskBoard.priority.high", "High"), color: "text-vscode-charts-red" },
	]

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] bg-vscode-editor-background border-vscode-panel-border">
				<DialogHeader>
					<DialogTitle className="text-vscode-foreground">
						{t("taskBoard.create.title", "Create New Task")}
					</DialogTitle>
					<DialogDescription className="text-vscode-descriptionForeground">
						{t(
							"taskBoard.create.description",
							"Create a new task for the agent to work on. Tasks can run in parallel with automatic conflict resolution.",
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Title */}
					<div className="grid gap-2">
						<label className="text-sm font-medium text-vscode-foreground">
							{t("taskBoard.create.taskTitle", "Task Title")} *
						</label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("taskBoard.create.titlePlaceholder", "e.g., Add authentication system")}
							className="bg-vscode-input-background border-vscode-input-border text-vscode-input-foreground"
						/>
					</div>

					{/* Description */}
					<div className="grid gap-2">
						<label className="text-sm font-medium text-vscode-foreground">
							{t("taskBoard.create.taskDescription", "Description")}
						</label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t(
								"taskBoard.create.descriptionPlaceholder",
								"Describe what the task should accomplish...",
							)}
							rows={3}
							className="bg-vscode-input-background border-vscode-input-border text-vscode-input-foreground resize-none"
						/>
					</div>

					{/* Priority and Status */}
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vscode-foreground">
								{t("taskBoard.create.priority", "Priority")}
							</label>
							<Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
								<SelectTrigger className="bg-vscode-input-background border-vscode-input-border text-vscode-input-foreground">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-vscode-dropdown-background border-vscode-dropdown-border">
									{priorityOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
											className={cn("focus:bg-vscode-list-hoverBackground", option.color)}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<label className="text-sm font-medium text-vscode-foreground">
								{t("taskBoard.create.status", "Initial Status")}
							</label>
							<Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
								<SelectTrigger className="bg-vscode-input-background border-vscode-input-border text-vscode-input-foreground">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-vscode-dropdown-background border-vscode-dropdown-border">
									<SelectItem
										value="draft"
										className="focus:bg-vscode-list-hoverBackground">
										{t("taskBoard.columns.draft", "Draft")}
									</SelectItem>
									<SelectItem
										value="active"
										className="focus:bg-vscode-list-hoverBackground">
										{t("taskBoard.columns.active", "Active")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Parallel Execution Info */}
					<div className="flex items-start gap-2 p-3 rounded-md bg-vscode-editor-inactiveSelectionBackground border border-vscode-panel-border">
						<div className="text-xs text-vscode-descriptionForeground">
							{t(
								"taskBoard.create.parallelInfo",
								"💡 Tasks in 'Active' status will be assigned to parallel agents. Each task runs in an isolated Git worktree.",
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="border-vscode-button-border text-vscode-button-foreground">
						{t("common.cancel", "Cancel")}
					</Button>
					<Button
						onClick={handleCreate}
						disabled={!title.trim()}
						className="bg-vscode-button-background hover:bg-vscode-button-hoverBackground text-vscode-button-foreground">
						{t("taskBoard.create.createTask", "Create Task")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default TaskCreateModal
