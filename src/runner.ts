import { exec } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { Executor } from "./executor";

interface ICommand {
	match?: string;
	notMatch?: string;
	cmd: string;
	isAsync: boolean;
	useShortcut?: boolean;
}

interface IConfig {
	shell: string;
	autoClearConsole: boolean;
	commands: ICommand[];
}

export class RunOnSaveExtension {
	private outputChannel: vscode.OutputChannel;
	private context: vscode.ExtensionContext;
	private config: IConfig;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.outputChannel = vscode.window.createOutputChannel("Run On Save");
		this.loadConfig();
	}

	private runInTerminal(command) {
		let editor = vscode.window.activeTextEditor
		let column = editor.viewColumn;
		Executor.runInTerminal(command)
	}

	private runAllInTerminal(commands: ICommand[]): void {
		commands.forEach(command => {
			this.runInTerminal(command.cmd);
		});
	}

	public get isEnabled(): boolean {
		return !!this.context.globalState.get("isEnabled", true);
	}
	public set isEnabled(value: boolean) {
		this.context.globalState.update("isEnabled", value);
		this.showOutputMessage();
	}

	public get shell(): string {
		return this.config.shell;
	}

	public get autoClearConsole(): boolean {
		return !!this.config.autoClearConsole;
	}

	public get commands(): ICommand[] {
		return this.config.commands || [];
	}

	public loadConfig(): void {
		this.config = vscode.workspace.getConfiguration("saveAndRun") as any as IConfig;
	}

	public showOutputMessage(message?: string): void {
		message = message || `Run On Save ${this.isEnabled ? "enabled" : "disabled"}.`;
		this.outputChannel.appendLine(message);
	}

	public showStatusMessage(message: string): vscode.Disposable {
		this.showOutputMessage(message);
		return vscode.window.setStatusBarMessage(message);
	}

	private findActiveCommands(document: vscode.TextDocument, onlyShortcut: boolean) {
		let match = (pattern: string) => pattern && pattern.length > 0 && new RegExp(pattern).test(document.fileName);
		let commandConfigs = this.commands
			.filter(cfg => {
				let matchPattern = cfg.match || "";
				let negatePattern = cfg.notMatch || "";
				// if no match pattern was provided, or if match pattern succeeds
				let isMatch = matchPattern.length === 0 || match(matchPattern);
				// negation has to be explicitly provided
				let isNegate = negatePattern.length > 0 && match(negatePattern);
				// negation wins over match
				return !isNegate && isMatch;
			});

		if (commandConfigs.length === 0) {
			return;
		}

		this.showStatusMessage("Running on save commands...");

		// build our commands by replacing parameters with values
		let commands: ICommand[] = [];
		for (let cfg of commandConfigs) {
			let cmdStr = cfg.cmd;
			let extName = path.extname(document.fileName);
			let root = vscode.workspace.rootPath;
			let relativeFile = "." + document.fileName.replace(root, "");
			cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
			cmdStr = cmdStr.replace(/\${file}/g, `${document.fileName}`);
			cmdStr = cmdStr.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`);
			cmdStr = cmdStr.replace(/\${fileBasename}/g, `${path.basename(document.fileName)}`);
			cmdStr = cmdStr.replace(/\${fileDirname}/g, `${path.dirname(document.fileName)}`);
			cmdStr = cmdStr.replace(/\${fileExtname}/g, `${extName}`);
			cmdStr = cmdStr.replace(/\${fileBasenameNoExt}/g, `${path.basename(document.fileName, extName)}`);
			cmdStr = cmdStr.replace(/\${cwd}/g, `${process.cwd()}`);
			// replace environment variables ${env.Name}
			cmdStr = cmdStr.replace(/\${env\.([^}]+)}/g, (sub: string, envName: string) => {
				return process.env[envName];
			});
			commands.push({
				cmd: cmdStr,
				isAsync: !!cfg.isAsync,
				useShortcut: cfg.useShortcut
			});
		}

		if (onlyShortcut) {
			return commands.filter(x => x.useShortcut === true);
		} else {
			return commands.filter(x => x.useShortcut !== true)
		}
	}

	public runCommands(document: vscode.TextDocument, onlyShortcut: boolean): void {
		if (this.autoClearConsole) {
			this.outputChannel.clear();
		}

		if (!this.isEnabled || this.commands.length === 0) {
			this.showOutputMessage();
		}

		let commands = this.findActiveCommands(document, onlyShortcut);
		this.runAllInTerminal(commands);
	}
}