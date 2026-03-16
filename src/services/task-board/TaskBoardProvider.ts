import * as vscode from "vscode"
import { EventEmitter } from "events"

/**
 * TaskBoardProvider - Manages multiple display modes for the Task Board
 * 
 * Display Modes:
 * 1. sidebar - Draggable panel like file explorer (WebviewView)
 * 2. tab - Editor tab alongside code files (WebviewPanel)
 * 3. window - Separate window for multi-monitor setups
 */
export class TaskBoardProvider extends EventEmitter implements vscode.Disposable {
	public static readonly viewType = "forgeai.taskBoard"
	public static readonly tabPanelId = "forgeai.taskBoard.tab"
	
	private panel: vscode.WebviewPanel | vscode.WebviewView | undefined
	private readonly extensionUri: vscode.Uri
	private readonly context: vscode.ExtensionContext
	private disposables: vscode.Disposable[] = []

	constructor(context: vscode.ExtensionContext) {
		super()
		this.context = context
		this.extensionUri = context.extensionUri
	}

	/**
	 * Open Task Board in specified display mode
	 */
	async open(mode: "sidebar" | "tab" | "window" = "tab"): Promise<void> {
		switch (mode) {
			case "sidebar":
				await this.openInSidebar()
				break
			case "tab":
				await this.openInTab()
				break
			case "window":
				await this.openInWindow()
				break
		}
	}

	/**
	 * Open as sidebar panel (draggable, like file explorer)
	 */
	private async openInSidebar(): Promise<void> {
		// This requires a contributes.viewsContainers in package.json
		// The sidebar view is registered via vscode.window.registerWebviewViewProvider
		await vscode.commands.executeCommand("workbench.view.extension.forgeai-taskBoard")
	}

	/**
	 * Open as editor tab (can be dragged, split, etc.)
	 */
	private async openInTab(): Promise<void> {
		// Close existing panel if any
		this.dispose()

		// Calculate target column
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))
		const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0

		if (!hasVisibleEditors) {
			await vscode.commands.executeCommand("workbench.action.newGroupRight")
		}

		const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

		// Create webview panel
		this.panel = vscode.window.createWebviewPanel(
			TaskBoardProvider.tabPanelId,
			"Task Board",
			targetCol,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this.extensionUri],
			}
		)

		// Set icon
		this.panel.iconPath = {
			light: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "panel_light.png"),
			dark: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "panel_dark.png"),
		}

		// Initialize webview
		await this.initializeWebview(this.panel)

		// Handle disposal
		this.panel.onDidDispose(
			() => {
				this.panel = undefined
				this.emit("disposed")
			},
			null,
			this.disposables
		)

		// Lock the editor group
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	/**
	 * Open in separate window (for multi-monitor setups)
	 */
	private async openInWindow(): Promise<void> {
		// Close existing panel if any
		this.dispose()

		// Create panel in a new window
		this.panel = vscode.window.createWebviewPanel(
			TaskBoardProvider.tabPanelId,
			"Task Board",
			{
				viewColumn: vscode.ViewColumn.One,
				preserveFocus: true,
			},
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this.extensionUri],
			}
		)

		// Set icon
		this.panel.iconPath = {
			light: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "panel_light.png"),
			dark: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "panel_dark.png"),
		}

		// Initialize webview
		await this.initializeWebview(this.panel)

		// Move to new window
		await vscode.commands.executeCommand("workbench.action.moveEditorToNewWindow")

		// Handle disposal
		this.panel.onDidDispose(
			() => {
				this.panel = undefined
				this.emit("disposed")
			},
			null,
			this.disposables
		)
	}

	/**
	 * Initialize webview content and message handling
	 */
	private async initializeWebview(panel: vscode.WebviewPanel | vscode.WebviewView): Promise<void> {
		// Get the webview
		const webview = panel instanceof vscode.WebviewPanel ? panel.webview : panel.webview

		// Set HTML content (will be loaded from webview-ui build)
		webview.html = this.getHtmlContent(webview)

		// Handle messages from webview
		webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case "ready":
						// Send initial state
						break
					case "createTask":
						// Handle task creation
						break
					case "updateTaskStatus":
						// Handle status update
						break
					case "openTask":
						// Open task in editor
						break
				}
			},
			null,
			this.disposables
		)
	}

	/**
	 * Get HTML content for the webview
	 */
	private getHtmlContent(webview: vscode.Webview): string {
		// In production, this would load the built webview-ui
		// For now, return a placeholder
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist", "assets", "index.js")
		)
		const stylesUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist", "assets", "index.css")
		)

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
	<link rel="stylesheet" href="${stylesUri}">
	<title>Task Board</title>
</head>
<body>
	<div id="root"></div>
	<script type="module" src="${scriptUri}"></script>
</body>
</html>`
	}

	/**
	 * Post message to webview
	 */
	postMessage(message: any): void {
		if (this.panel instanceof vscode.WebviewPanel) {
			this.panel.webview.postMessage(message)
		} else if (this.panel instanceof vscode.WebviewView) {
			this.panel.webview.postMessage(message)
		}
	}

	/**
	 * Show picker for display mode selection
	 */
	static async showDisplayModePicker(): Promise<"sidebar" | "tab" | "window" | undefined> {
		const result = await vscode.window.showQuickPick(
			[
				{
					label: "$(layout-sidebar-left) Sidebar Panel",
					description: "Draggable panel like file explorer",
					value: "sidebar" as const,
				},
				{
					label: "$(layout) Editor Tab",
					description: "Tab alongside code files, can be split/dragged",
					value: "tab" as const,
				},
				{
					label: "$(empty-window) New Window",
					description: "Separate window for multi-monitor setups",
					value: "window" as const,
				},
			],
			{
				placeHolder: "Select how to open Task Board",
				title: "Task Board Display Mode",
			}
		)

		return result?.value
	}

	/**
	 * Get current display mode
	 */
	getDisplayMode(): "sidebar" | "tab" | "window" | undefined {
		if (!this.panel) {
			return undefined
		}
		if (this.panel instanceof vscode.WebviewView) {
			return "sidebar"
		}
		// Check if it's in a separate window
		// This is a heuristic - VS Code doesn't expose window info directly
		return "tab"
	}

	/**
	 * Focus the Task Board
	 */
	focus(): void {
		if (this.panel instanceof vscode.WebviewPanel) {
			this.panel.reveal()
		} else if (this.panel instanceof vscode.WebviewView) {
			this.panel.show(true)
		}
	}

	/**
	 * Check if Task Board is visible
	 */
	isVisible(): boolean {
		if (this.panel instanceof vscode.WebviewPanel) {
			return this.panel.visible
		} else if (this.panel instanceof vscode.WebviewView) {
			return this.panel.visible
		}
		return false
	}

	dispose(): void {
		if (this.panel instanceof vscode.WebviewPanel) {
			this.panel.dispose()
		}
		this.panel = undefined
		this.disposables.forEach((d) => d.dispose())
		this.disposables = []
	}
}

// Singleton instance
let taskBoardProvider: TaskBoardProvider | undefined

export function getTaskBoardProvider(context: vscode.ExtensionContext): TaskBoardProvider {
	if (!taskBoardProvider) {
		taskBoardProvider = new TaskBoardProvider(context)
	}
	return taskBoardProvider
}

export function disposeTaskBoardProvider(): void {
	taskBoardProvider?.dispose()
	taskBoardProvider = undefined
}
