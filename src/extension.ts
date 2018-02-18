import * as vscode from "vscode"
import { Executor } from "./executor"
import { RunOnSaveExtension } from "./runner"

export function activate(context: vscode.ExtensionContext): void {

	let extension = new RunOnSaveExtension(context)
	extension.showOutputMessage();

	/*
	context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal: vscode.Terminal) => {
		Executor.onDidCloseTerminal(closedTerminal)
	}))
	*/
	if ("onDidCloseTerminal" in vscode.window as any) {
		(vscode.window as any).onDidCloseTerminal((terminal) => {
			Executor.onDidCloseTerminal(terminal)
		});
	}

	vscode.workspace.onDidChangeConfiguration(() => {
		let disposeStatus = extension.showStatusMessage("Run On Save: Reloading config.")
		extension.loadConfig()
		disposeStatus.dispose()
	});

	vscode.commands.registerCommand("extension.saveAndRun.enable", () => {
		extension.isEnabled = true
	});

	vscode.commands.registerCommand("extension.saveAndRun.disable", () => {
		extension.isEnabled = false
	});

	vscode.commands.registerCommand("extension.saveAndRun.execute", () => {
		let doc = vscode.window.activeTextEditor.document
		doc.save()
		extension.runCommands(doc, true)
	});

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		extension.runCommands(document, false)
	})
}