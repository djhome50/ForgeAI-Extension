import { exec } from "child_process"
import * as fs from "fs/promises"
import * as path from "path"

import { GitWorktreeManager } from "../GitWorktreeManager"

// Mock dependencies
vi.mock("child_process", () => ({
	exec: vi.fn(),
}))

vi.mock("fs/promises", () => ({
	mkdir: vi.fn().mockResolvedValue(undefined),
	writeFile: vi.fn().mockResolvedValue(undefined),
	unlink: vi.fn().mockResolvedValue(undefined),
	readFile: vi.fn(),
}))

vi.mock("path", () => ({
	join: vi.fn((...args) => args.join("/")),
}))

describe("GitWorktreeManager", () => {
	let manager: GitWorktreeManager
	const mockWorkspaceRoot = "/workspace/test-project"

	beforeEach(() => {
		vi.clearAllMocks()
		manager = new GitWorktreeManager(mockWorkspaceRoot)
	})

	describe("initialize", () => {
		it("should create worktrees directory", async () => {
			await manager.initialize()
			expect(fs.mkdir).toHaveBeenCalled()
		})
	})

	describe("createWorktree", () => {
		it("should create a worktree for a task", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) => resolve({ stdout: "", stderr: "" }),
			})) as any)

			const options = {
				taskId: "task-123",
				taskTitle: "Test Feature",
				baseBranch: "main",
				createBranch: true,
			}

			const result = await manager.createWorktree(options)

			expect(result.taskId).toBe("task-123")
			expect(result.branchName).toContain("task/")
			expect(result.baseBranch).toBe("main")
			expect(result.status).toBe("active")
		})

		it("should sanitize task title for branch name", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) => resolve({ stdout: "", stderr: "" }),
			})) as any)

			const options = {
				taskId: "task-456",
				taskTitle: "Add User Authentication!!! @#$%",
				baseBranch: "main",
				createBranch: true,
			}

			const result = await manager.createWorktree(options)

			expect(result.branchName).toMatch(/task\/task-456-add-user-authentication/)
		})
	})

	describe("getWorktree", () => {
		it("should return undefined for non-existent task", () => {
			const result = manager.getWorktree("non-existent")
			expect(result).toBeUndefined()
		})
	})

	describe("listWorktrees", () => {
		it("should return empty array initially", () => {
			const result = manager.listWorktrees()
			expect(result).toEqual([])
		})
	})

	describe("isGitRepository", () => {
		it("should return true when git is initialized", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) => resolve({ stdout: ".git", stderr: "" }),
			})) as any)

			const result = await GitWorktreeManager.isGitRepository("/workspace/test")
			expect(result).toBe(true)
		})

		it("should return false when git is not initialized", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: () => {
					throw new Error("Not a git repository")
				},
			})) as any)

			const result = await GitWorktreeManager.isGitRepository("/workspace/test")
			expect(result).toBe(false)
		})
	})
})
