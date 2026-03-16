/**
 * ForgeAI Provider
 *
 * Routes LLM requests to the ForgeAI backend API instead of directly to LLM providers.
 * This enables cloud-based agent orchestration with local file system control.
 */

import { Anthropic } from "@anthropic-ai/sdk"
import type { ModelInfo } from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"

import type { ApiHandlerOptions } from "../../shared/api"
import { ApiStream } from "../transform/stream"
import { BaseProvider } from "./base-provider"
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index"

import { ForgeAIClient, forgeAIModels, forgeAIDefaultModelId } from "@roo-code/core/forgeai-client"

/**
 * ForgeAI Handler
 *
 * Implements the ApiHandler interface for ForgeAI backend.
 * Converts Roo Code message format to ForgeAI API requests.
 */
export class ForgeAIHandler extends BaseProvider implements SingleCompletionHandler {
	private options: ApiHandlerOptions
	private client: ForgeAIClient
	private readonly providerName = "ForgeAI"
	private currentModel: { id: string; info: ModelInfo }

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options

		// Extract ForgeAI-specific settings
		const baseUrl = this.options.forgeaiBaseUrl || "http://localhost:8000"
		const apiKey = this.options.apiKey

		this.client = new ForgeAIClient({
			baseUrl,
			apiKey,
			timeout: 60000,
		})

		// Set default model
		this.currentModel = {
			id: this.options.modelId || forgeAIDefaultModelId,
			info: forgeAIModels[this.options.modelId || forgeAIDefaultModelId] || forgeAIModels[forgeAIDefaultModelId],
		}
	}

	/**
	 * Create a message stream from the ForgeAI backend
	 *
	 * Converts Anthropic-style messages to ForgeAI format,
	 * sends to backend, and yields streaming responses.
	 */
	async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		try {
			// Convert Anthropic messages to ForgeAI format
			const forgeAIMessages = this.convertMessages(messages)

			// Determine mode from model ID
			const mode = this.getModeFromModelId(this.currentModel.id)

			// Get project context from options
			const projectContext = {
				rootPath: this.options.cwd || process.cwd(),
				name: this.options.projectName,
				description: this.options.projectDescription,
			}

			// Make request to ForgeAI backend
			const response = await this.client.chat({
				messages: forgeAIMessages,
				mode,
				projectContext,
			})

			// Yield the response as a stream
			// ForgeAI returns structured responses, we convert to stream format
			yield {
				type: "text",
				text: response.response,
			}

			// If there are parsed tasks, yield them as tool use
			if (response.parsedTasks && response.parsedTasks.length > 0) {
				yield {
					type: "tool_use",
					name: "update_todo_list",
					input: {
						todos: response.parsedTasks.map((task, index) => ({
							id: String(index + 1),
							content: `${task.title}: ${task.description}`,
							status: "pending",
							priority: task.priority || "medium",
						})),
					},
				}
			}

			// Yield usage information
			if (response.tokensUsed) {
				yield {
					type: "usage",
					inputTokens: response.tokensUsed,
					outputTokens: response.tokensUsed,
					totalCost: response.costUsd || 0,
				}
			}
		} catch (error) {
			// Log error and re-throw
			console.error("[ForgeAI] Error in createMessage:", error)
			throw error
		}
	}

	/**
	 * Get the current model information
	 */
	getModel(): { id: string; info: ModelInfo } {
		return this.currentModel
	}

	/**
	 * Complete a single prompt (for simple completions)
	 */
	async completePrompt(prompt: string): Promise<string> {
		const response = await this.client.chat({
			messages: [{ role: "user", content: prompt }],
			mode: "architect",
			projectContext: {
				rootPath: this.options.cwd || process.cwd(),
			},
		})
		return response.response
	}

	/**
	 * Convert Anthropic message format to ForgeAI format
	 */
	private convertMessages(messages: Anthropic.Messages.MessageParam[]): Array<{
		role: "user" | "assistant" | "system"
		content: string
		images?: string[]
	}> {
		return messages.map((msg) => {
			if (typeof msg.content === "string") {
				return {
					role: msg.role as "user" | "assistant",
					content: msg.content,
				}
			}

			// Handle array content (text + images)
			const textParts: string[] = []
			const images: string[] = []

			for (const block of msg.content) {
				if (block.type === "text") {
					textParts.push(block.text)
				} else if (block.type === "image") {
					// Convert image source to data URI
					if (block.source.type === "base64") {
						images.push(`data:${block.source.media_type};base64,${block.source.data}`)
					}
				}
			}

			return {
				role: msg.role as "user" | "assistant",
				content: textParts.join("\n"),
				images: images.length > 0 ? images : undefined,
			}
		})
	}

	/**
	 * Map model ID to ForgeAI mode
	 */
	private getModeFromModelId(modelId: string): "architect" | "code" | "debug" | "deploy" | "orchestrator" {
		const modeMap: Record<string, "architect" | "code" | "debug" | "deploy" | "orchestrator"> = {
			"forgeai-architect": "architect",
			"forgeai-code": "code",
			"forgeai-debug": "debug",
			"forgeai-deploy": "deploy",
			"forgeai-orchestrator": "orchestrator",
		}

		return modeMap[modelId] || "architect"
	}

	/**
	 * Override token counting - ForgeAI handles this server-side
	 */
	async countTokens(content: Anthropic.Messages.ContentBlockParam[]): Promise<number> {
		// ForgeAI counts tokens server-side, return estimate
		// Rough estimate: ~4 characters per token
		const text = content
			.filter((block): block is { type: "text"; text: string } => block.type === "text")
			.map((block) => block.text)
			.join("")

		return Math.ceil(text.length / 4)
	}
}

/**
 * Export model information for registration
 */
export { forgeAIModels, forgeAIDefaultModelId }
