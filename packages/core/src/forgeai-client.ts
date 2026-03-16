/**
 * ForgeAI Backend Adapter
 *
 * Routes LLM requests to the ForgeAI backend API instead of directly to LLM providers.
 * This enables cloud-based agent orchestration with local file system control.
 */

import type { ModelInfo } from "@roo-code/types"

export interface ForgeAIConfig {
	baseUrl: string
	apiKey?: string
	timeout?: number
}

export interface ForgeAIChatMessage {
	role: "user" | "assistant" | "system"
	content: string
	images?: string[] // data URIs
}

export interface ForgeAIChatRequest {
	messages: ForgeAIChatMessage[]
	mode: "architect" | "code" | "debug" | "deploy" | "orchestrator"
	projectContext: {
		rootPath: string
		name?: string
		description?: string
	}
	images?: string[]
}

export interface ForgeAIChatResponse {
	response: string
	parsedTasks?: Array<{
		title: string
		description: string
		assigned_agent: string
		priority?: string
		dependencies?: string[]
	}>
	mode: string
	tokensUsed?: number
	costUsd?: number
}

export interface ForgeAITaskExecuteRequest {
	task: {
		title: string
		description: string
		assigned_agent: string
	}
	projectPath: string
	projectContext: string
}

export interface ForgeAITaskExecuteResponse {
	success: boolean
	operations: Array<{
		action: string
		path: string
		result: {
			success: boolean
			error?: string
		}
	}>
	reasoning: string
	pendingChanges: Array<{
		path: string
		action: string
		contentBefore?: string
	}>
}

export interface ForgeAICheckpointResponse {
	description: string
	commitHash?: string
	fileChanges: Array<{
		path: string
		action: string
		contentBefore?: string
	}>
	timestamp: string
}

/**
 * ForgeAI Backend Client
 *
 * Handles communication with the ForgeAI backend API for:
 * - Chat with Architect agent (task planning)
 * - Task execution with Code agent (file operations)
 * - Shadow Git checkpointing
 * - WebSocket real-time streaming
 */
export class ForgeAIClient {
	private config: ForgeAIConfig

	constructor(config: ForgeAIConfig) {
		this.config = {
			baseUrl: config.baseUrl || "http://localhost:8000",
			timeout: config.timeout || 60000,
			...config,
		}
	}

	/**
	 * Chat with the ForgeAI Architect agent
	 */
	async chat(request: ForgeAIChatRequest): Promise<ForgeAIChatResponse> {
		const response = await fetch(`${this.config.baseUrl}/api/v1/chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
			},
			body: JSON.stringify(request),
			signal: AbortSignal.timeout(this.config.timeout!),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`ForgeAI chat failed: ${response.status} - ${error}`)
		}

		return response.json()
	}

	/**
	 * Execute a task with the ForgeAI Code agent
	 */
	async executeTask(request: ForgeAITaskExecuteRequest): Promise<ForgeAITaskExecuteResponse> {
		const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/execute`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
			},
			body: JSON.stringify(request),
			signal: AbortSignal.timeout(this.config.timeout!),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`ForgeAI task execution failed: ${response.status} - ${error}`)
		}

		return response.json()
	}

	/**
	 * Create a Shadow Git checkpoint
	 */
	async createCheckpoint(projectPath: string, description?: string): Promise<ForgeAICheckpointResponse> {
		const response = await fetch(`${this.config.baseUrl}/api/v1/checkpoint/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
			},
			body: JSON.stringify({
				project_path: projectPath,
				description: description || "Manual checkpoint",
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`ForgeAI checkpoint failed: ${response.status} - ${error}`)
		}

		return response.json()
	}

	/**
	 * Rollback to a previous checkpoint
	 */
	async rollback(projectPath: string, commitHash?: string): Promise<{ success: boolean; message?: string }> {
		const response = await fetch(`${this.config.baseUrl}/api/v1/checkpoint/rollback`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
			},
			body: JSON.stringify({
				project_path: projectPath,
				description: commitHash || "",
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`ForgeAI rollback failed: ${response.status} - ${error}`)
		}

		return response.json()
	}

	/**
	 * Execute a file operation directly
	 */
	async fileOperation(
		action: "read" | "write" | "delete" | "list",
		path: string,
		content?: string,
	): Promise<{ success: boolean; content?: string; items?: any[]; error?: string }> {
		const response = await fetch(`${this.config.baseUrl}/api/v1/files/execute`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
			},
			body: JSON.stringify({
				action,
				path,
				content,
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`ForgeAI file operation failed: ${response.status} - ${error}`)
		}

		return response.json()
	}

	/**
	 * Create a WebSocket connection for real-time streaming
	 */
	createChatWebSocket(onMessage: (data: any) => void, onError?: (error: Error) => void): WebSocket {
		const ws = new WebSocket(`${this.config.baseUrl.replace("http", "ws")}/api/v1/ws/chat`)

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				onMessage(data)
			} catch (e) {
				onError?.(new Error(`Failed to parse WebSocket message: ${e}`))
			}
		}

		ws.onerror = (event) => {
			onError?.(new Error("WebSocket error"))
		}

		return ws
	}

	/**
	 * Create a WebSocket connection for task execution progress
	 */
	createExecuteWebSocket(onMessage: (data: any) => void, onError?: (error: Error) => void): WebSocket {
		const ws = new WebSocket(`${this.config.baseUrl.replace("http", "ws")}/api/v1/ws/execute`)

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				onMessage(data)
			} catch (e) {
				onError?.(new Error(`Failed to parse WebSocket message: ${e}`))
			}
		}

		ws.onerror = () => {
			onError?.(new Error("WebSocket error"))
		}

		return ws
	}
}

/**
 * Model definitions for ForgeAI provider
 */
export const forgeAIModels: Record<string, ModelInfo> = {
	"forgeai-architect": {
		maxTokens: 16384,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Architect - Plans and designs system architecture",
	},
	"forgeai-code": {
		maxTokens: 16384,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Code - Implements features and writes code",
	},
	"forgeai-debug": {
		maxTokens: 16384,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Debug - Diagnoses and fixes software issues",
	},
	"forgeai-deploy": {
		maxTokens: 16384,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Deploy - Handles infrastructure and deployment",
	},
	"forgeai-orchestrator": {
		maxTokens: 16384,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description: "ForgeAI Orchestrator - Coordinates tasks across multiple agents",
	},
}

export const forgeAIDefaultModelId = "forgeai-architect"
