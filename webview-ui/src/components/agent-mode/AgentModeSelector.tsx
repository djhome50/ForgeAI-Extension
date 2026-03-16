import { cn } from "@/lib/utils"
import { t } from "i18next"
import { Zap, Brain, DollarSign, Rocket, Infinity } from "lucide-react"
import { useState } from "react"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { StandardTooltip } from "@/components/ui/standard-tooltip"

/**
 * Agent Modes inspired by Replit Agent 4
 * 
 * Each mode has different tradeoffs in:
 * - Speed: How fast the agent responds
 * - Cost: Token usage and model selection
 * - Capability: What the agent can do autonomously
 * - Use Case: Best scenarios for this mode
 */
export type AgentMode = "lite" | "autonomous" | "economy" | "power" | "max"

export interface AgentModeConfig {
	id: AgentMode
	label: string
	description: string
	icon: React.ReactNode
	speed: "fast" | "medium" | "slow"
	cost: "low" | "medium" | "high"
	capability: "basic" | "standard" | "advanced" | "full"
	useCase: string
	features: string[]
}

const agentModes: AgentModeConfig[] = [
	{
		id: "lite",
		label: t("agentMode.lite.label", "Lite"),
		description: t("agentMode.lite.description", "Quick, single-step tasks with minimal overhead"),
		icon: <Zap className="size-4" />,
		speed: "fast",
		cost: "low",
		capability: "basic",
		useCase: t("agentMode.lite.useCase", "Quick fixes, simple questions, formatting"),
		features: [
			t("agentMode.lite.feature1", "Single-step execution"),
			t("agentMode.lite.feature2", "Minimal context usage"),
			t("agentMode.lite.feature3", "Fast response time"),
		],
	},
	{
		id: "autonomous",
		label: t("agentMode.autonomous.label", "Autonomous"),
		description: t("agentMode.autonomous.description", "Multi-step tasks with auto-approval"),
		icon: <Brain className="size-4" />,
		speed: "medium",
		cost: "medium",
		capability: "standard",
		useCase: t("agentMode.autonomous.useCase", "Feature implementation, refactoring, testing"),
		features: [
			t("agentMode.autonomous.feature1", "Multi-step planning"),
			t("agentMode.autonomous.feature2", "Auto-approval for safe operations"),
			t("agentMode.autonomous.feature3", "Progress tracking"),
		],
	},
	{
		id: "economy",
		label: t("agentMode.economy.label", "Economy"),
		description: t("agentMode.economy.description", "Cost-optimized with smaller models"),
		icon: <DollarSign className="size-4" />,
		speed: "medium",
		cost: "low",
		capability: "standard",
		useCase: t("agentMode.economy.useCase", "Documentation, simple features, learning"),
		features: [
			t("agentMode.economy.feature1", "Uses cost-effective models"),
			t("agentMode.economy.feature2", "Optimized token usage"),
			t("agentMode.economy.feature3", "Budget-friendly"),
		],
	},
	{
		id: "power",
		label: t("agentMode.power.label", "Power"),
		description: t("agentMode.power.description", "Full capability with best models"),
		icon: <Rocket className="size-4" />,
		speed: "medium",
		cost: "high",
		capability: "advanced",
		useCase: t("agentMode.power.useCase", "Complex features, architecture, debugging"),
		features: [
			t("agentMode.power.feature1", "Best available models"),
			t("agentMode.power.feature2", "Extended context"),
			t("agentMode.power.feature3", "Advanced reasoning"),
		],
	},
	{
		id: "max",
		label: t("agentMode.max.label", "Max"),
		description: t("agentMode.max.description", "Long-running, hands-off building experience"),
		icon: <Infinity className="size-4" />,
		speed: "slow",
		cost: "high",
		capability: "full",
		useCase: t("agentMode.max.useCase", "Full projects, complex systems, autonomous development"),
		features: [
			t("agentMode.max.feature1", "Unlimited iterations"),
			t("agentMode.max.feature2", "Full autonomy"),
			t("agentMode.max.feature3", "Comprehensive testing"),
			t("agentMode.max.feature4", "Self-verification"),
		],
	},
]

interface AgentModeSelectorProps {
	value: AgentMode
	onChange: (mode: AgentMode) => void
	disabled?: boolean
	className?: string
}

const speedColors = {
	fast: "text-vscode-charts-green",
	medium: "text-vscode-charts-yellow",
	slow: "text-vscode-charts-orange",
}

const costColors = {
	low: "text-vscode-charts-green",
	medium: "text-vscode-charts-yellow",
	high: "text-vscode-charts-red",
}

const capabilityColors = {
	basic: "text-vscode-charts-blue",
	standard: "text-vscode-charts-purple",
	advanced: "text-vscode-charts-orange",
	full: "text-vscode-charts-yellow",
}

export function AgentModeSelector({ value, onChange, disabled, className }: AgentModeSelectorProps) {
	const [open, setOpen] = useState(false)
	const selectedMode = agentModes.find((m) => m.id === value) ?? agentModes[1] // Default to autonomous

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled}
					className={cn(
						"gap-2 text-vscode-foreground border-vscode-button-border",
						"hover:bg-vscode-list-hoverBackground",
						className
					)}>
					{selectedMode.icon}
					<span className="hidden sm:inline">{selectedMode.label}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80 bg-vscode-editor-background border-vscode-panel-border p-0"
				align="start">
				<div className="p-3 border-b border-vscode-panel-border">
					<h3 className="text-sm font-semibold text-vscode-foreground">
						{t("agentMode.selectMode", "Select Agent Mode")}
					</h3>
					<p className="text-xs text-vscode-descriptionForeground mt-1">
						{t("agentMode.selectDescription", "Choose how the agent will approach your task")}
					</p>
				</div>
				<div className="max-h-[400px] overflow-y-auto">
					{agentModes.map((mode) => (
						<button
							key={mode.id}
							onClick={() => {
								onChange(mode.id)
								setOpen(false)
							}}
							className={cn(
								"w-full text-left p-3 hover:bg-vscode-list-hoverBackground transition-colors",
								"border-b border-vscode-panel-border last:border-b-0",
								value === mode.id && "bg-vscode-list-activeSelectionBackground"
							)}>
							<div className="flex items-start gap-3">
								<div className={cn(
									"mt-0.5 shrink-0",
									value === mode.id ? "text-vscode-charts-blue" : "text-vscode-descriptionForeground"
								)}>
									{mode.icon}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium text-vscode-foreground">
											{mode.label}
										</span>
										{value === mode.id && (
											<span className="text-xs text-vscode-charts-blue">
												{t("common.active", "Active")}
											</span>
										)}
									</div>
									<p className="text-xs text-vscode-descriptionForeground mt-0.5 line-clamp-2">
										{mode.description}
									</p>
									<div className="flex items-center gap-3 mt-2 text-xs">
										<span className={speedColors[mode.speed]}>
											{t("agentMode.speed", "Speed")}: {mode.speed}
										</span>
										<span className={costColors[mode.cost]}>
											{t("agentMode.cost", "Cost")}: {mode.cost}
										</span>
									</div>
									<div className="mt-1.5 flex flex-wrap gap-1">
										{mode.features.slice(0, 2).map((feature, idx) => (
											<span
												key={idx}
												className="text-[10px] px-1.5 py-0.5 rounded bg-vscode-editor-inactiveSelectionBackground text-vscode-descriptionForeground">
												{feature}
											</span>
										))}
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}

export { agentModes }
export default AgentModeSelector
