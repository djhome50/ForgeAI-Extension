import * as vscode from "vscode"
import { exec } from "child_process"
import { promisify } from "util"
import * as path from "path"
import * as fs from "fs/promises"

const execAsync = promisify(exec)

/**
 * MergeAgent - Intelligent conflict resolution for parallel task merges
 * 
 * When multiple tasks are developed in parallel, merging them back
 * can cause conflicts. This agent provides:
 * - Conflict detection and analysis
 * - Intelligent resolution strategies
 * - Interactive conflict resolution UI
 * - Automated resolution for safe conflicts
 */
export interface MergeConflict {
	filePath: string
	ours: string			// Content from current branch
	theirs: string			// Content from merging branch
	base?: string			// Common ancestor content
	startLine: number
	endLine: number
	conflictMarkers: string[]
}

export interface ConflictResolution {
	strategy: "ours" | "theirs" | "both" | "manual" | "custom"
	resolvedContent?: string
	confidence: number		// 0-1, how confident the agent is
	reasoning?: string
}

export interface MergeResult {
	success: boolean
	conflicts: MergeConflict[]
	resolutions: Map<string, ConflictResolution>
	mergedFiles: string[]
	skippedFiles: string[]
	errors: string[]
}

export type ResolutionStrategy = 
	| "auto-prefer-ours"		// Always prefer current branch
	| "auto-prefer-theirs"		// Always prefer incoming changes
	| "auto-combine"			// Try to combine both changes
	| "interactive"				// Ask user for each conflict
	| "ai-assisted"				// Use AI to suggest resolution

export class MergeAgent {
	private workspaceRoot: string
	private resolutionStrategy: ResolutionStrategy = "ai-assisted"
	private conflicts: MergeConflict[] = []
	private resolutions: Map<string, ConflictResolution> = new Map()

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
	}

	/**
	 * Set the resolution strategy
	 */
	setStrategy(strategy: ResolutionStrategy): void {
		this.resolutionStrategy = strategy
	}

	/**
	 * Analyze a merge conflict in a file
	 */
	async analyzeConflicts(filePath: string): Promise<MergeConflict[]> {
		const absolutePath = path.join(this.workspaceRoot, filePath)
		const content = await fs.readFile(absolutePath, "utf-8")
		const lines = content.split("\n")

		const conflicts: MergeConflict[] = []
		let currentConflict: Partial<MergeConflict> | null = null
		let conflictStart = 0
		let inOurs = false
		let inTheirs = false
		let oursContent: string[] = []
		let theirsContent: string[] = []
		let baseContent: string[] = []

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]

			if (line.startsWith("<<<<<<<")) {
				// Start of conflict
				conflictStart = i + 1
				currentConflict = {
					filePath,
					startLine: conflictStart,
					conflictMarkers: [],
				}
				inOurs = true
				inTheirs = false
				oursContent = []
				theirsContent = []
				baseContent = []
			} else if (line.startsWith("=======") && currentConflict) {
				// Separator between ours and theirs
				inOurs = false
				inTheirs = true
			} else if (line.startsWith("|||||||") && currentConflict) {
				// Base version (if using diff3 style)
				inOurs = false
				// This is the base content
			} else if (line.startsWith(">>>>>>>") && currentConflict) {
				// End of conflict
				inTheirs = false
				currentConflict.endLine = i
				currentConflict.ours = oursContent.join("\n")
				currentConflict.theirs = theirsContent.join("\n")
				if (baseContent.length > 0) {
					currentConflict.base = baseContent.join("\n")
				}
				conflicts.push(currentConflict as MergeConflict)
				currentConflict = null
			} else if (inOurs) {
				oursContent.push(line)
			} else if (inTheirs) {
				theirsContent.push(line)
			}
		}

		return conflicts
	}

	/**
	 * Find all files with conflicts
	 */
	async findConflictingFiles(): Promise<string[]> {
		try {
			const { stdout } = await execAsync("git diff --name-only --diff-filter=U", {
				cwd: this.workspaceRoot,
			})
			return stdout.split("\n").filter(Boolean)
		} catch {
			return []
		}
	}

	/**
	 * Analyze all conflicts in the repository
	 */
	async analyzeAllConflicts(): Promise<MergeConflict[]> {
		const conflictingFiles = await this.findConflictingFiles()
		const allConflicts: MergeConflict[] = []

		for (const file of conflictingFiles) {
			const fileConflicts = await this.analyzeConflicts(file)
			allConflicts.push(...fileConflicts)
		}

		this.conflicts = allConflicts
		return allConflicts
	}

	/**
	 * Suggest resolution for a conflict
	 */
	suggestResolution(conflict: MergeConflict): ConflictResolution {
		// Simple heuristics for automated resolution
		const oursLines = conflict.ours.split("\n").filter(Boolean)
		const theirsLines = conflict.theirs.split("\n").filter(Boolean)

		// If one side is empty, prefer the non-empty side
		if (oursLines.length === 0 && theirsLines.length > 0) {
			return {
				strategy: "theirs",
				resolvedContent: conflict.theirs,
				confidence: 0.9,
				reasoning: "Current branch has no changes, accepting incoming changes",
			}
		}

		if (theirsLines.length === 0 && oursLines.length > 0) {
			return {
				strategy: "ours",
				resolvedContent: conflict.ours,
				confidence: 0.9,
				reasoning: "Incoming branch has no changes, keeping current changes",
			}
		}

		// If both sides are identical, use either
		if (conflict.ours === conflict.theirs) {
			return {
				strategy: "ours",
				resolvedContent: conflict.ours,
				confidence: 1.0,
				reasoning: "Both sides are identical",
			}
		}

		// Check if changes are in different parts (non-overlapping)
		const oursChangedLines = new Set<number>()
		const theirsChangedLines = new Set<number>()

		if (conflict.base) {
			const baseLines = conflict.base.split("\n")
			
			// Find which lines changed in each version
			oursLines.forEach((line, idx) => {
				if (baseLines[idx] !== line) {
					oursChangedLines.add(idx)
				}
			})

			theirsLines.forEach((line, idx) => {
				if (baseLines[idx] !== line) {
					theirsChangedLines.add(idx)
				}
			})

			// Check for non-overlapping changes
			const hasOverlap = [...oursChangedLines].some(idx => theirsChangedLines.has(idx))

			if (!hasOverlap && oursChangedLines.size > 0 && theirsChangedLines.size > 0) {
				// Can combine both changes
				const combined = this.combineNonOverlapping(
					conflict.base,
					conflict.ours,
					conflict.theirs,
					oursChangedLines,
					theirsChangedLines
				)

				return {
					strategy: "both",
					resolvedContent: combined,
					confidence: 0.8,
					reasoning: "Changes are non-overlapping, combining both",
				}
			}
		}

		// Default to manual resolution needed
		return {
			strategy: "manual",
			confidence: 0.0,
			reasoning: "Complex conflict requires manual resolution",
		}
	}

	/**
	 * Combine non-overlapping changes
	 */
	private combineNonOverlapping(
		base: string,
		ours: string,
		theirs: string,
		oursChanged: Set<number>,
		theirsChanged: Set<number>
	): string {
		const baseLines = base.split("\n")
		const oursLines = ours.split("\n")
		const theirsLines = theirs.split("\n")
		const result: string[] = []

		const maxLen = Math.max(baseLines.length, oursLines.length, theirsLines.length)

		for (let i = 0; i < maxLen; i++) {
			if (oursChanged.has(i)) {
				result.push(oursLines[i] ?? "")
			} else if (theirsChanged.has(i)) {
				result.push(theirsLines[i] ?? "")
			} else {
				result.push(baseLines[i] ?? "")
			}
		}

		return result.join("\n")
	}

	/**
	 * Apply a resolution to a file
	 */
	async applyResolution(
		filePath: string,
		conflictIndex: number,
		resolution: ConflictResolution
	): Promise<void> {
		if (resolution.strategy === "manual") {
			throw new Error("Cannot apply manual resolution automatically")
		}

		const absolutePath = path.join(this.workspaceRoot, filePath)
		let content = await fs.readFile(absolutePath, "utf-8")

		// Find and replace the conflict
		const conflictRegex = /<<<<<<< .+\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> .+/g
		let matchIndex = 0

		content = content.replace(conflictRegex, (match, ours, theirs) => {
			if (matchIndex === conflictIndex) {
				matchIndex++
				return resolution.resolvedContent ?? ""
			}
			matchIndex++
			return match
		})

		await fs.writeFile(absolutePath, content)
	}

	/**
	 * Auto-resolve all conflicts that can be safely resolved
	 */
	async autoResolve(): Promise<{
		resolved: number
		manual: number
		resolutions: Map<string, ConflictResolution>
	}> {
		const conflicts = await this.analyzeAllConflicts()
		let resolved = 0
		let manual = 0

		for (let i = 0; i < conflicts.length; i++) {
			const conflict = conflicts[i]
			const resolution = this.suggestResolution(conflict)

			if (resolution.confidence >= 0.8 && resolution.resolvedContent !== undefined) {
				await this.applyResolution(conflict.filePath, i, resolution)
				this.resolutions.set(`${conflict.filePath}:${i}`, resolution)
				resolved++
			} else {
				manual++
			}
		}

		return { resolved, manual, resolutions: this.resolutions }
	}

	/**
	 * Show interactive conflict resolution UI
	 */
	async showResolutionUI(): Promise<void> {
		const conflicts = await this.analyzeAllConflicts()

		if (conflicts.length === 0) {
			vscode.window.showInformationMessage("No merge conflicts found")
			return
		}

		// Create quick pick items for each conflict
		const items = conflicts.map((conflict, index) => ({
			label: `$(alert) ${conflict.filePath}:${conflict.startLine}`,
			description: `Lines ${conflict.startLine}-${conflict.endLine}`,
			detail: `Conflict ${index + 1} of ${conflicts.length}`,
			conflict,
			index,
		}))

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: "Select a conflict to resolve",
		})

		if (selected) {
			await this.resolveConflictInteractively(selected.conflict, selected.index)
		}
	}

	/**
	 * Resolve a single conflict interactively
	 */
	private async resolveConflictInteractively(
		conflict: MergeConflict,
		index: number
	): Promise<void> {
		const resolution = this.suggestResolution(conflict)

		const options = [
			{
				label: "$(check) Accept Current (Ours)",
				description: "Keep changes from current branch",
				action: "ours" as const,
			},
			{
				label: "$(check-all) Accept Incoming (Theirs)",
				description: "Use changes from incoming branch",
				action: "theirs" as const,
			},
			{
				label: "$(fold) Accept Both",
				description: "Combine both changes",
				action: "both" as const,
			},
			{
				label: "$(edit) Edit Manually",
				description: "Open editor to resolve manually",
				action: "manual" as const,
			},
		]

		// Add AI suggestion if available
		if (resolution.confidence > 0) {
			options.unshift({
				label: `$(sparkle) AI Suggestion (${Math.round(resolution.confidence * 100)}% confidence)`,
				description: resolution.reasoning,
				action: "ai" as const,
			})
		}

		const selected = await vscode.window.showQuickPick(options, {
			placeHolder: `Resolve conflict in ${conflict.filePath}`,
		})

		if (!selected) return

		let finalResolution: ConflictResolution

		switch (selected.action) {
			case "ours":
				finalResolution = {
					strategy: "ours",
					resolvedContent: conflict.ours,
					confidence: 1.0,
					reasoning: "User selected current branch changes",
				}
				break
			case "theirs":
				finalResolution = {
					strategy: "theirs",
					resolvedContent: conflict.theirs,
					confidence: 1.0,
					reasoning: "User selected incoming branch changes",
				}
				break
			case "both":
				// Combine both (simple concatenation, may need adjustment)
				finalResolution = {
					strategy: "both",
					resolvedContent: conflict.ours + "\n" + conflict.theirs,
					confidence: 0.5,
					reasoning: "User selected to combine both changes",
				}
				break
			case "ai":
				finalResolution = resolution
				break
			case "manual":
				// Open the file at the conflict location
				const document = await vscode.workspace.openTextDocument(
					vscode.Uri.file(path.join(this.workspaceRoot, conflict.filePath))
				)
				const editor = await vscode.window.showTextDocument(document)
				const range = new vscode.Range(
					Math.max(0, conflict.startLine - 2),
					0,
					conflict.endLine + 2,
					0
				)
				editor.selection = new vscode.Selection(range.start, range.end)
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
				return
		}

		await this.applyResolution(conflict.filePath, index, finalResolution)
		vscode.window.showInformationMessage(
			`Resolved conflict in ${conflict.filePath}`
		)
	}

	/**
	 * Complete the merge after all conflicts are resolved
	 */
	async completeMerge(): Promise<MergeResult> {
		const result: MergeResult = {
			success: false,
			conflicts: this.conflicts,
			resolutions: this.resolutions,
			mergedFiles: [],
			skippedFiles: [],
			errors: [],
		}

		try {
			// Check if any conflicts remain
			const remainingConflicts = await this.findConflictingFiles()

			if (remainingConflicts.length > 0) {
				result.errors.push(
					`Cannot complete merge: ${remainingConflicts.length} files still have conflicts`
				)
				return result
			}

			// Stage all resolved files
			await execAsync("git add -A", { cwd: this.workspaceRoot })

			// Get list of staged files
			const { stdout: stagedFiles } = await execAsync(
				"git diff --cached --name-only",
				{ cwd: this.workspaceRoot }
			)
			result.mergedFiles = stagedFiles.split("\n").filter(Boolean)

			// Complete the merge
			await execAsync('git commit -m "Merge completed with conflict resolution"', {
				cwd: this.workspaceRoot,
			})

			result.success = true
		} catch (error) {
			result.errors.push(`Failed to complete merge: ${error}`)
		}

		return result
	}

	/**
	 * Abort the merge and reset to pre-merge state
	 */
	async abortMerge(): Promise<void> {
		await execAsync("git merge --abort", { cwd: this.workspaceRoot })
		this.conflicts = []
		this.resolutions.clear()
	}
}

// Singleton instance
let mergeAgent: MergeAgent | undefined

export function getMergeAgent(workspaceRoot: string): MergeAgent {
	if (!mergeAgent) {
		mergeAgent = new MergeAgent(workspaceRoot)
	}
	return mergeAgent
}

export function disposeMergeAgent(): void {
	mergeAgent = undefined
}
