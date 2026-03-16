import * as vscode from "vscode"
import { exec } from "child_process"
import { promisify } from "util"
import * as path from "path"
import * as fs from "fs/promises"

const execAsync = promisify(exec)

/**
 * GitWorktreeManager - Manages isolated git worktrees for parallel tasks
 * 
 * Each task gets its own worktree, allowing multiple agents to work
 * on different tasks simultaneously without conflicts.
 * 
 * Worktree naming convention:
 * - Task ID: task-<taskId>-<timestamp>
 * - Branch: task/<taskId>
 */
export interface WorktreeInfo {
	taskId: string
	worktreePath: string
	branchName: string
	baseBranch: string
	createdAt: Date
	status: "active" | "merged" | "abandoned"
}

export interface CreateWorktreeOptions {
	taskId: string
	taskTitle: string
	baseBranch?: string
	createBranch?: boolean
}

export interface MergeWorktreeOptions {
	taskId: string
	targetBranch?: string
	deleteAfterMerge?: boolean
	squash?: boolean
}

export class GitWorktreeManager {
	private workspaceRoot: string
	private worktreesDir: string
	private worktrees: Map<string, WorktreeInfo> = new Map()

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.worktreesDir = path.join(workspaceRoot, ".git", "worktrees", "forgeai-tasks")
	}

	/**
	 * Initialize the worktree manager
	 */
	async initialize(): Promise<void> {
		// Ensure worktrees directory exists
		await fs.mkdir(this.worktreesDir, { recursive: true })
		
		// Load existing worktrees
		await this.loadExistingWorktrees()
	}

	/**
	 * Load existing worktrees from git
	 */
	private async loadExistingWorktrees(): Promise<void> {
		try {
			const { stdout } = await execAsync("git worktree list --porcelain", {
				cwd: this.workspaceRoot,
			})

			const lines = stdout.split("\n")
			let currentWorktree: Partial<WorktreeInfo> = {}

			for (const line of lines) {
				if (line.startsWith("worktree ")) {
					currentWorktree.worktreePath = line.substring(9)
				} else if (line.startsWith("HEAD ")) {
					// HEAD commit
				} else if (line.startsWith("branch ")) {
					const branch = line.substring(7)
					if (branch.includes("task/")) {
						const taskId = branch.split("/")[1]
						if (taskId) {
							currentWorktree.taskId = taskId
							currentWorktree.branchName = branch
						}
					}
				} else if (line === "" && currentWorktree.taskId) {
					// End of worktree entry
					this.worktrees.set(currentWorktree.taskId, {
						taskId: currentWorktree.taskId!,
						worktreePath: currentWorktree.worktreePath!,
						branchName: currentWorktree.branchName!,
						baseBranch: "main", // Default, would need to track this
						createdAt: new Date(),
						status: "active",
					})
					currentWorktree = {}
				}
			}
		} catch (error) {
			// No worktrees or git not initialized
			console.log("No existing worktrees found or git not initialized")
		}
	}

	/**
	 * Create a new worktree for a task
	 */
	async createWorktree(options: CreateWorktreeOptions): Promise<WorktreeInfo> {
		const { taskId, taskTitle, baseBranch = "main", createBranch = true } = options

		// Check if worktree already exists
		if (this.worktrees.has(taskId)) {
			throw new Error(`Worktree already exists for task ${taskId}`)
		}

		// Sanitize task title for branch name
		const sanitizedTitle = taskTitle
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.substring(0, 30)

		const branchName = `task/${taskId}-${sanitizedTitle}`
		const worktreePath = path.join(this.worktreesDir, taskId)

		try {
			// Ensure base branch is up to date
			await execAsync(`git fetch origin ${baseBranch}`, {
				cwd: this.workspaceRoot,
			})

			if (createBranch) {
				// Create new branch from base
				await execAsync(`git branch ${branchName} origin/${baseBranch}`, {
					cwd: this.workspaceRoot,
				})
			}

			// Create worktree
			await execAsync(`git worktree add -b ${branchName} "${worktreePath}" origin/${baseBranch}`, {
				cwd: this.workspaceRoot,
			})

			const worktreeInfo: WorktreeInfo = {
				taskId,
				worktreePath,
				branchName,
				baseBranch,
				createdAt: new Date(),
				status: "active",
			}

			this.worktrees.set(taskId, worktreeInfo)

			// Save worktree metadata
			await this.saveWorktreeMetadata(worktreeInfo)

			return worktreeInfo
		} catch (error) {
			// Cleanup on failure
			try {
				await execAsync(`git worktree remove "${worktreePath}" --force`, {
					cwd: this.workspaceRoot,
				})
				await execAsync(`git branch -D ${branchName}`, {
					cwd: this.workspaceRoot,
				})
			} catch {
				// Ignore cleanup errors
			}
			throw error
		}
	}

	/**
	 * Get worktree info for a task
	 */
	getWorktree(taskId: string): WorktreeInfo | undefined {
		return this.worktrees.get(taskId)
	}

	/**
	 * List all worktrees
	 */
	listWorktrees(): WorktreeInfo[] {
		return Array.from(this.worktrees.values())
	}

	/**
	 * Get the status of a worktree (files changed, etc.)
	 */
	async getWorktreeStatus(taskId: string): Promise<{
		modified: number
		added: number
		deleted: number
		untracked: number
		ahead: number
		behind: number
	}> {
		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		// Get file status
		const { stdout: statusOutput } = await execAsync("git status --porcelain", {
			cwd: worktree.worktreePath,
		})

		let modified = 0
		let added = 0
		let deleted = 0
		let untracked = 0

		for (const line of statusOutput.split("\n").filter(Boolean)) {
			const status = line.substring(0, 2)
			if (status.includes("M")) modified++
			else if (status.includes("A") || status.includes("C")) added++
			else if (status.includes("D")) deleted++
			else if (status.includes("?")) untracked++
		}

		// Get ahead/behind count
		let ahead = 0
		let behind = 0

		try {
			const { stdout: branchOutput } = await execAsync(
				`git rev-list --left-right --count origin/${worktree.baseBranch}...HEAD`,
				{ cwd: worktree.worktreePath }
			)
			const [behindStr, aheadStr] = branchOutput.trim().split("\t")
			behind = parseInt(behindStr, 10) || 0
			ahead = parseInt(aheadStr, 10) || 0
		} catch {
			// Branch may not exist remotely
		}

		return { modified, added, deleted, untracked, ahead, behind }
	}

	/**
	 * Merge a worktree's changes back to base branch
	 */
	async mergeWorktree(options: MergeWorktreeOptions): Promise<{
		success: boolean
		conflicts?: string[]
		message?: string
	}> {
		const { taskId, targetBranch, deleteAfterMerge = true, squash = false } = options

		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		const mergeTarget = targetBranch || worktree.baseBranch

		try {
			// Switch to target branch in main worktree
			await execAsync(`git checkout ${mergeTarget}`, {
				cwd: this.workspaceRoot,
			})

			// Pull latest changes
			await execAsync(`git pull origin ${mergeTarget}`, {
				cwd: this.workspaceRoot,
			})

			// Merge the task branch
			const mergeCmd = squash
				? `git merge --squash ${worktree.branchName}`
				: `git merge --no-ff ${worktree.branchName} -m "Merge task ${taskId}"`

			await execAsync(mergeCmd, {
				cwd: this.workspaceRoot,
			})

			// Check for conflicts
			const { stdout: statusOutput } = await execAsync("git status --porcelain", {
				cwd: this.workspaceRoot,
			})

			const conflicts: string[] = []
			for (const line of statusOutput.split("\n").filter(Boolean)) {
				if (line.startsWith("UU") || line.startsWith("AA") || line.startsWith("DD")) {
					conflicts.push(line.substring(3))
				}
			}

			if (conflicts.length > 0) {
				return {
					success: false,
					conflicts,
					message: `Merge conflicts detected in ${conflicts.length} files`,
				}
			}

			// Push merged changes
			await execAsync(`git push origin ${mergeTarget}`, {
				cwd: this.workspaceRoot,
			})

			// Update worktree status
			worktree.status = "merged"

			// Optionally delete worktree
			if (deleteAfterMerge) {
				await this.deleteWorktree(taskId)
			}

			return {
				success: true,
				message: `Successfully merged task ${taskId} into ${mergeTarget}`,
			}
		} catch (error) {
			return {
				success: false,
				message: `Merge failed: ${error}`,
			}
		}
	}

	/**
	 * Delete a worktree
	 */
	async deleteWorktree(taskId: string): Promise<void> {
		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		// Remove worktree
		await execAsync(`git worktree remove "${worktree.worktreePath}" --force`, {
			cwd: this.workspaceRoot,
		})

		// Delete branch if not merged
		try {
			await execAsync(`git branch -D ${worktree.branchName}`, {
				cwd: this.workspaceRoot,
			})
		} catch {
			// Branch may already be deleted or merged
		}

		// Remove metadata
		this.worktrees.delete(taskId)
		await this.deleteWorktreeMetadata(taskId)
	}

	/**
	 * Abandon a worktree (mark as abandoned without merging)
	 */
	async abandonWorktree(taskId: string): Promise<void> {
		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		worktree.status = "abandoned"
		await this.saveWorktreeMetadata(worktree)

		// Optionally delete the worktree
		await this.deleteWorktree(taskId)
	}

	/**
	 * Save worktree metadata to disk
	 */
	private async saveWorktreeMetadata(worktree: WorktreeInfo): Promise<void> {
		const metadataPath = path.join(this.worktreesDir, `${worktree.taskId}.json`)
		await fs.writeFile(
			metadataPath,
			JSON.stringify(
				{
					...worktree,
					createdAt: worktree.createdAt.toISOString(),
				},
				null,
				2
			)
		)
	}

	/**
	 * Delete worktree metadata
	 */
	private async deleteWorktreeMetadata(taskId: string): Promise<void> {
		const metadataPath = path.join(this.worktreesDir, `${taskId}.json`)
		try {
			await fs.unlink(metadataPath)
		} catch {
			// File may not exist
		}
	}

	/**
	 * Open worktree in VS Code
	 */
	async openWorktreeInVsCode(taskId: string): Promise<void> {
		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		const uri = vscode.Uri.file(worktree.worktreePath)
		await vscode.commands.executeCommand("vscode.openFolder", uri, true)
	}

	/**
	 * Get diff between worktree and base branch
	 */
	async getWorktreeDiff(taskId: string): Promise<string> {
		const worktree = this.worktrees.get(taskId)
		if (!worktree) {
			throw new Error(`Worktree not found for task ${taskId}`)
		}

		const { stdout } = await execAsync(`git diff origin/${worktree.baseBranch}...HEAD`, {
			cwd: worktree.worktreePath,
		})

		return stdout
	}

	/**
	 * Check if git is initialized in workspace
	 */
	static async isGitRepository(workspaceRoot: string): Promise<boolean> {
		try {
			await execAsync("git rev-parse --git-dir", { cwd: workspaceRoot })
			return true
		} catch {
			return false
		}
	}
}

// Singleton instance
let worktreeManager: GitWorktreeManager | undefined

export function getWorktreeManager(workspaceRoot: string): GitWorktreeManager {
	if (!worktreeManager) {
		worktreeManager = new GitWorktreeManager(workspaceRoot)
	}
	return worktreeManager
}

export function disposeWorktreeManager(): void {
	worktreeManager = undefined
}
