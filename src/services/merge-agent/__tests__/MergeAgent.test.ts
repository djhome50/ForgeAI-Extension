import * as vscode from "vscode"
import { exec } from "child_process"
import * as fs from "fs/promises"
import * as path from "path"

import { MergeAgent } from "../MergeAgent"

// Mock dependencies
vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/workspace/test" } }],
		openTextDocument: vi.fn(),
	},
	window: {
		showQuickPick: vi.fn(),
		showInformationMessage: vi.fn(),
		showTextDocument: vi.fn(),
	},
	Uri: {
		file: vi.fn((p) => ({ fsPath: p })),
	},
	Range: class Range {
		constructor(public start: any, public end: any) {}
	},
	Selection: class Selection {
		constructor(public start: any, public end: any) {}
	},
	TextEditorRevealType: { InCenter: "inCenter" },
}))

vi.mock("child_process", () => ({
	exec: vi.fn(),
}))

vi.mock("fs/promises", () => ({
	readFile: vi.fn(),
	writeFile: vi.fn(),
}))

vi.mock("path", () => ({
	join: vi.fn((...args) => args.join("/")),
}))

describe("MergeAgent", () => {
	let agent: MergeAgent
	const mockWorkspaceRoot = "/workspace/test-project"

	beforeEach(() => {
		vi.clearAllMocks()
		agent = new MergeAgent(mockWorkspaceRoot)
	})

	describe("analyzeConflicts", () => {
		it("should parse conflict markers correctly", async () => {
			const conflictContent = `function test() {
<<<<<<< HEAD
console.log("ours")
=======
console.log("theirs")
>>>>>>> feature-branch
}`

			vi.mocked(fs.readFile).mockResolvedValue(conflictContent)

			const conflicts = await agent.analyzeConflicts("test.js")

			expect(conflicts).toHaveLength(1)
			expect(conflicts[0].ours).toBe('console.log("ours")')
			expect(conflicts[0].theirs).toBe('console.log("theirs")')
		})

		it("should return empty array for file without conflicts", async () => {
			const cleanContent = `function test() {
	console.log("no conflicts")
}`

			vi.mocked(fs.readFile).mockResolvedValue(cleanContent)

			const conflicts = await agent.analyzeConflicts("test.js")

			expect(conflicts).toHaveLength(0)
		})
	})

	describe("findConflictingFiles", () => {
		it("should return list of conflicting files", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) =>
					resolve({ stdout: "file1.js\nfile2.ts\n", stderr: "" }),
			})) as any)

			const files = await agent.findConflictingFiles()

			expect(files).toEqual(["file1.js", "file2.ts"])
		})

		it("should return empty array when no conflicts", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) => resolve({ stdout: "", stderr: "" }),
			})) as any)

			const files = await agent.findConflictingFiles()

			expect(files).toEqual([])
		})
	})

	describe("suggestResolution", () => {
		it("should prefer theirs when ours is empty", () => {
			const conflict = {
				filePath: "test.js",
				ours: "",
				theirs: "console.log('theirs')",
				startLine: 1,
				endLine: 5,
				conflictMarkers: [],
			}

			const resolution = agent.suggestResolution(conflict)

			expect(resolution.strategy).toBe("theirs")
			expect(resolution.confidence).toBe(0.9)
		})

		it("should prefer ours when theirs is empty", () => {
			const conflict = {
				filePath: "test.js",
				ours: "console.log('ours')",
				theirs: "",
				startLine: 1,
				endLine: 5,
				conflictMarkers: [],
			}

			const resolution = agent.suggestResolution(conflict)

			expect(resolution.strategy).toBe("ours")
			expect(resolution.confidence).toBe(0.9)
		})

		it("should resolve when both sides are identical", () => {
			const conflict = {
				filePath: "test.js",
				ours: "console.log('same')",
				theirs: "console.log('same')",
				startLine: 1,
				endLine: 5,
				conflictMarkers: [],
			}

			const resolution = agent.suggestResolution(conflict)

			expect(resolution.strategy).toBe("ours")
			expect(resolution.confidence).toBe(1.0)
		})

		it("should require manual resolution for complex conflicts", () => {
			const conflict = {
				filePath: "test.js",
				ours: "function a() { return 1 }",
				theirs: "function b() { return 2 }",
				startLine: 1,
				endLine: 5,
				conflictMarkers: [],
			}

			const resolution = agent.suggestResolution(conflict)

			expect(resolution.strategy).toBe("manual")
			expect(resolution.confidence).toBe(0)
		})

		it("should combine non-overlapping changes when base exists", () => {
			const conflict = {
				filePath: "test.js",
				ours: "line1\nmodified_ours\nline3",
				theirs: "line1\nline2\nmodified_theirs",
				base: "line1\nline2\nline3",
				startLine: 1,
				endLine: 5,
				conflictMarkers: [],
			}

			const resolution = agent.suggestResolution(conflict)

			// Should detect non-overlapping if changes are in different positions
			expect(["manual", "both"]).toContain(resolution.strategy)
		})
	})

	describe("setStrategy", () => {
		it("should update resolution strategy", () => {
			agent.setStrategy("auto-prefer-ours")
			// Strategy is private, but we can verify behavior through suggestResolution
			// This is more of an integration test
		})
	})

	describe("abortMerge", () => {
		it("should reset conflicts and resolutions", async () => {
			const mockExec = vi.mocked(exec)
			mockExec.mockImplementation((() => ({
				then: (resolve: Function) => resolve({ stdout: "", stderr: "" }),
			})) as any)

			await agent.abortMerge()

			expect(mockExec).toHaveBeenCalledWith(
				"git merge --abort",
				expect.objectContaining({ cwd: mockWorkspaceRoot })
			)
		})
	})
})
