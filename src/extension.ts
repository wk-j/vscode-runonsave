import * as vscode from 'vscode';
import { RunOnSaveExtension } from "./runner";

export function activate(context: vscode.ExtensionContext): void {

	var extension = new RunOnSaveExtension(context);
	extension.showOutputMessage();

	vscode.workspace.onDidChangeConfiguration(() => {
		let disposeStatus = extension.showStatusMessage('Run On Save: Reloading config.');
		extension.loadConfig();
		disposeStatus.dispose();
	});

	vscode.commands.registerCommand('extension.saveAndRun.enable', () => {
		extension.isEnabled = true;
	});

	vscode.commands.registerCommand('extension.saveAndRun.disable', () => {
		extension.isEnabled = false;
	});

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		extension.runCommands(document);
	});
}
