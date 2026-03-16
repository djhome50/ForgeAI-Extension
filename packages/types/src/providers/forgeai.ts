import type { ModelInfo } from "../model.js"

/**
 * ForgeAI Provider
 *
 * Routes requests to the ForgeAI backend API which handles
 * agent orchestration, task planning, and code execution.
 */

export type ForgeAIModelId = keyof typeof forgeAIModels
export const forgeAIDefaultModelId: ForgeAIModelId = "forgeai-architect"

export const forgeAIModels = {
	"forgeai-architect": {
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0, // Pricing handled by backend
		outputPrice: 0,
		description: "ForgeAI Architect - Plans and designs system architecture, breaks down complex tasks",
	},
	"forgeai-code": {
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Code - Implements features, writes and modifies code",
	},
	"forgeai-debug": {
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Debug - Diagnoses and fixes software issues",
	},
	"forgeai-deploy": {
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Deploy - Handles infrastructure and deployment",
	},
	"forgeai-orchestrator": {
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Orchestrator - Coordinates tasks across multiple specialized agents",
	},
} as const satisfies Record<string, ModelInfo>
