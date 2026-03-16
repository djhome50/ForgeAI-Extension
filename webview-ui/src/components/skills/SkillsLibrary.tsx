import { cn } from "@/lib/utils"
import { t } from "i18next"
import { BookOpen, Code, Bug, GitBranch, TestTube, FileText, Rocket, Wrench, Search, Zap } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"

/**
 * Skills Library - Predefined templates for common tasks
 * 
 * Inspired by Replit Agent 4's skills system
 * Each skill is a pre-configured prompt template for specific tasks
 */
export type SkillCategory = "development" | "testing" | "deployment" | "maintenance" | "analysis"

export interface Skill {
	id: string
	name: string
	description: string
	category: SkillCategory
	icon: React.ReactNode
	promptTemplate: string
	tags: string[]
	estimatedTime?: string
	agentMode?: "lite" | "autonomous" | "economy" | "power" | "max"
}

const skills: Skill[] = [
	{
		id: "implement-feature",
		name: t("skills.implementFeature.name", "Implement Feature"),
		description: t("skills.implementFeature.description", "Implement a new feature from requirements"),
		category: "development",
		icon: <Code className="size-4" />,
		promptTemplate: `Implement the following feature:

**Feature Name**: {{featureName}}
**Requirements**: {{requirements}}

Please:
1. Analyze the requirements and create a plan
2. Implement the feature with proper error handling
3. Add appropriate tests
4. Update documentation if needed`,
		tags: ["feature", "implementation", "coding"],
		estimatedTime: "30-60 min",
		agentMode: "autonomous",
	},
	{
		id: "fix-bug",
		name: t("skills.fixBug.name", "Fix Bug"),
		description: t("skills.fixBug.description", "Debug and fix a reported issue"),
		category: "maintenance",
		icon: <Bug className="size-4" />,
		promptTemplate: `Fix the following bug:

**Bug Description**: {{bugDescription}}
**Expected Behavior**: {{expectedBehavior}}
**Actual Behavior**: {{actualBehavior}}

Please:
1. Reproduce the issue
2. Identify the root cause
3. Implement a fix
4. Add regression tests
5. Verify the fix works`,
		tags: ["bug", "debug", "fix"],
		estimatedTime: "15-45 min",
		agentMode: "autonomous",
	},
	{
		id: "add-tests",
		name: t("skills.addTests.name", "Add Tests"),
		description: t("skills.addTests.description", "Add comprehensive tests for code"),
		category: "testing",
		icon: <TestTube className="size-4" />,
		promptTemplate: `Add comprehensive tests for:

**Target**: {{target}}
**Test Type**: {{testType}}

Please:
1. Analyze the code to understand test cases
2. Write unit tests for edge cases
3. Add integration tests if needed
4. Ensure good code coverage`,
		tags: ["testing", "unit tests", "integration"],
		estimatedTime: "20-40 min",
		agentMode: "autonomous",
	},
	{
		id: "code-review",
		name: t("skills.codeReview.name", "Code Review"),
		description: t("skills.codeReview.description", "Review code for quality and best practices"),
		category: "analysis",
		icon: <Search className="size-4" />,
		promptTemplate: `Review the following code:

**Files**: {{files}}

Please analyze:
1. Code quality and readability
2. Potential bugs or issues
3. Performance considerations
4. Security vulnerabilities
5. Best practices adherence
6. Suggestions for improvement`,
		tags: ["review", "quality", "best practices"],
		estimatedTime: "10-20 min",
		agentMode: "lite",
	},
	{
		id: "refactor",
		name: t("skills.refactor.name", "Refactor Code"),
		description: t("skills.refactor.description", "Improve code structure without changing behavior"),
		category: "maintenance",
		icon: <Wrench className="size-4" />,
		promptTemplate: `Refactor the following code:

**Target**: {{target}}
**Goal**: {{goal}}

Please:
1. Analyze current structure
2. Identify improvement opportunities
3. Refactor while preserving behavior
4. Ensure all tests still pass
5. Update documentation if needed`,
		tags: ["refactor", "cleanup", "improvement"],
		estimatedTime: "20-40 min",
		agentMode: "autonomous",
	},
	{
		id: "create-pr",
		name: t("skills.createPR.name", "Create Pull Request"),
		description: t("skills.createPR.description", "Create a well-structured pull request"),
		category: "deployment",
		icon: <GitBranch className="size-4" />,
		promptTemplate: `Create a pull request for:

**Branch**: {{branch}}
**Description**: {{description}}

Please:
1. Summarize the changes
2. List affected files
3. Explain the implementation approach
4. Note any breaking changes
5. Suggest reviewers if known`,
		tags: ["pr", "git", "review"],
		estimatedTime: "5-15 min",
		agentMode: "lite",
	},
	{
		id: "write-docs",
		name: t("skills.writeDocs.name", "Write Documentation"),
		description: t("skills.writeDocs.description", "Create or update documentation"),
		category: "development",
		icon: <FileText className="size-4" />,
		promptTemplate: `Write documentation for:

**Subject**: {{subject}}
**Type**: {{docType}}

Please:
1. Write clear, concise documentation
2. Include examples where helpful
3. Document parameters and return values
4. Add usage notes if relevant`,
		tags: ["documentation", "docs", "readme"],
		estimatedTime: "15-30 min",
		agentMode: "economy",
	},
	{
		id: "deploy-service",
		name: t("skills.deployService.name", "Deploy Service"),
		description: t("skills.deployService.description", "Deploy a service to production"),
		category: "deployment",
		icon: <Rocket className="size-4" />,
		promptTemplate: `Deploy the following service:

**Service**: {{service}}
**Environment**: {{environment}}

Please:
1. Verify all tests pass
2. Check configuration
3. Deploy to the specified environment
4. Verify deployment health
5. Document any issues`,
		tags: ["deploy", "production", "release"],
		estimatedTime: "10-30 min",
		agentMode: "power",
	},
	{
		id: "quick-fix",
		name: t("skills.quickFix.name", "Quick Fix"),
		description: t("skills.quickFix.description", "Make a small, targeted change"),
		category: "maintenance",
		icon: <Zap className="size-4" />,
		promptTemplate: `Quick fix for:

**Issue**: {{issue}}

Make the minimal necessary change to resolve this issue.`,
		tags: ["quick", "small", "fix"],
		estimatedTime: "5-10 min",
		agentMode: "lite",
	},
	{
		id: "full-feature",
		name: t("skills.fullFeature.name", "Full Feature Development"),
		description: t("skills.fullFeature.description", "Complete feature from design to deployment"),
		category: "development",
		icon: <BookOpen className="size-4" />,
		promptTemplate: `Develop a complete feature:

**Feature**: {{feature}}
**Requirements**: {{requirements}}

Please:
1. Design the solution architecture
2. Implement the feature
3. Add comprehensive tests
4. Write documentation
5. Create a pull request
6. Verify deployment`,
		tags: ["feature", "complete", "end-to-end"],
		estimatedTime: "2-4 hours",
		agentMode: "max",
	},
]

const categoryColors: Record<SkillCategory, string> = {
	development: "bg-vscode-charts-blue/20 text-vscode-charts-blue",
	testing: "bg-vscode-charts-green/20 text-vscode-charts-green",
	deployment: "bg-vscode-charts-purple/20 text-vscode-charts-purple",
	maintenance: "bg-vscode-charts-orange/20 text-vscode-charts-orange",
	analysis: "bg-vscode-charts-yellow/20 text-vscode-charts-yellow",
}

interface SkillsLibraryProps {
	onSelectSkill: (skill: Skill, variables: Record<string, string>) => void
	className?: string
}

export function SkillsLibrary({ onSelectSkill, className }: SkillsLibraryProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null)
	const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
	const [variableValues, setVariableValues] = useState<Record<string, string>>({})

	// Extract variables from prompt template
	const extractVariables = (template: string): string[] => {
		const matches = template.match(/{{(\w+)}}/g) || []
		return matches.map((m) => m.replace(/{{|}}/g, ""))
	}

	// Filter skills by search and category
	const filteredSkills = skills.filter((skill) => {
		const matchesSearch =
			!searchQuery ||
			skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			skill.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

		const matchesCategory = !selectedCategory || skill.category === selectedCategory

		return matchesSearch && matchesCategory
	})

	// Group skills by category
	const groupedSkills = filteredSkills.reduce(
		(acc, skill) => {
			if (!acc[skill.category]) {
				acc[skill.category] = []
			}
			acc[skill.category].push(skill)
			return acc
		},
		{} as Record<SkillCategory, Skill[]>,
	)

	const handleSelectSkill = (skill: Skill) => {
		setSelectedSkill(skill)
		// Initialize variable values with empty strings
		const vars = extractVariables(skill.promptTemplate)
		const initialValues: Record<string, string> = {}
		vars.forEach((v) => {
			initialValues[v] = ""
		})
		setVariableValues(initialValues)
	}

	const handleApplySkill = () => {
		if (selectedSkill) {
			onSelectSkill(selectedSkill, variableValues)
			setSelectedSkill(null)
			setVariableValues({})
		}
	}

	return (
		<div className={cn("flex flex-col h-full", className)}>
			{/* Search */}
			<div className="p-3 border-b border-vscode-panel-border">
				<Input
					placeholder={t("skills.searchPlaceholder", "Search skills...")}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="bg-vscode-input-background border-vscode-input-border"
				/>
			</div>

			{/* Category filters */}
			<div className="flex flex-wrap gap-1 p-2 border-b border-vscode-panel-border">
				<Button
					variant={selectedCategory === null ? "default" : "ghost"}
					size="sm"
					onClick={() => setSelectedCategory(null)}
					className="text-xs">
					{t("skills.allCategories", "All")}
				</Button>
				{(["development", "testing", "deployment", "maintenance", "analysis"] as SkillCategory[]).map(
					(category) => (
						<Button
							key={category}
							variant={selectedCategory === category ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedCategory(category)}
							className={cn("text-xs", selectedCategory === category && categoryColors[category])}>
							{category}
						</Button>
					),
				)}
			</div>

			{/* Skills list */}
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-4">
					{Object.entries(groupedSkills).map(([category, categorySkills]) => (
						<div key={category}>
							<h3 className="text-xs font-semibold text-vscode-descriptionForeground uppercase tracking-wider mb-2 px-2">
								{category}
							</h3>
							<div className="space-y-1">
								{categorySkills.map((skill) => (
									<button
										key={skill.id}
										onClick={() => handleSelectSkill(skill)}
										className={cn(
											"w-full text-left p-2 rounded hover:bg-vscode-list-hoverBackground transition-colors",
											"flex items-start gap-2",
										)}>
										<div className={cn("mt-0.5 shrink-0", categoryColors[skill.category])}>
											{skill.icon}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<span className="font-medium text-vscode-foreground text-sm">
													{skill.name}
												</span>
												{skill.estimatedTime && (
													<span className="text-[10px] text-vscode-descriptionForeground">
														{skill.estimatedTime}
													</span>
												)}
											</div>
											<p className="text-xs text-vscode-descriptionForeground line-clamp-1">
												{skill.description}
											</p>
											<div className="flex flex-wrap gap-1 mt-1">
												{skill.tags.slice(0, 3).map((tag) => (
													<span
														key={tag}
														className="text-[10px] px-1 py-0.5 rounded bg-vscode-editor-inactiveSelectionBackground text-vscode-descriptionForeground">
														{tag}
													</span>
												))}
											</div>
										</div>
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</ScrollArea>

			{/* Skill detail dialog */}
			<Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
				<DialogContent className="bg-vscode-editor-background border-vscode-panel-border max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{selectedSkill?.icon}
							{selectedSkill?.name}
						</DialogTitle>
						<DialogDescription>{selectedSkill?.description}</DialogDescription>
					</DialogHeader>

					{selectedSkill && (
						<div className="space-y-4">
							<p className="text-sm text-vscode-descriptionForeground">
								{t("skills.fillVariables", "Fill in the required information:")}
							</p>

							{extractVariables(selectedSkill.promptTemplate).map((variable) => (
								<div key={variable}>
									<label className="text-xs font-medium text-vscode-foreground mb-1 block">
										{variable.replace(/([A-Z])/g, " $1").trim()}
									</label>
									<Input
										value={variableValues[variable] || ""}
										onChange={(e) =>
											setVariableValues((prev) => ({
												...prev,
												[variable]: e.target.value,
											}))
										}
										placeholder={t(`skills.variables.${variable}.placeholder`, `Enter ${variable.toLowerCase()}`)}
										className="bg-vscode-input-background border-vscode-input-border"
									/>
								</div>
							))}

							{selectedSkill.agentMode && (
								<div className="flex items-center gap-2 text-xs text-vscode-descriptionForeground">
									<span>{t("skills.recommendedMode", "Recommended mode:")}</span>
									<span className="font-medium capitalize">{selectedSkill.agentMode}</span>
								</div>
							)}
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setSelectedSkill(null)}>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button onClick={handleApplySkill}>
							{t("skills.applySkill", "Apply Skill")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export { skills }
export default SkillsLibrary
