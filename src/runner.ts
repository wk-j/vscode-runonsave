import * as vscode from "vscode";
import {exec} from 'child_process';
import * as path from 'path';
import * as ncp  from "copy-paste";

interface ICommand {
	match?: string;
	notMatch?: string;
	cmd: string;
	isAsync: boolean;
}

interface IConfig {
	shell: string;
	autoClearConsole: boolean;
	commands: Array<ICommand>;
}

export class RunOnSaveExtension {
	private outputChannel: vscode.OutputChannel;
	private context: vscode.ExtensionContext;
	private config: IConfig;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.outputChannel = vscode.window.createOutputChannel('Run On Save');
		this.loadConfig();
	}

	private runInTerminal(command) {
		 ncp.copy(command + '\n', function () {
			vscode.commands.executeCommand("workbench.action.terminal.paste"); 
			var editor = vscode.window.activeTextEditor;
			if(editor) {
				editor.show();
			}
		});
    }

	private runAllInTerminal(commands: ICommand[]): void {
		commands.forEach(command => {
			this.runInTerminal(command.cmd);
		});
	}

	public get isEnabled(): boolean {
		return !!this.context.globalState.get('isEnabled', true);
	}
	public set isEnabled(value: boolean) {
		this.context.globalState.update('isEnabled', value);
		this.showOutputMessage();
	}

	public get shell(): string {
		return this.config.shell;
	}

	public get autoClearConsole(): boolean {
		return !!this.config.autoClearConsole;
	}

	public get commands(): Array<ICommand> {
		return this.config.commands || [];
	}

	public loadConfig(): void {
		this.config = <IConfig><any>vscode.workspace.getConfiguration('saveAndRun');
	}

	public showOutputMessage(message?: string): void {
		message = message || `Run On Save ${this.isEnabled ? 'enabled' : 'disabled'}.`;
		this.outputChannel.appendLine(message);
	}

	public showStatusMessage(message: string): vscode.Disposable {
		this.showOutputMessage(message);
		return vscode.window.setStatusBarMessage(message);
	}

	public runCommands(document: vscode.TextDocument): void {
		if (this.autoClearConsole) {
			this.outputChannel.clear();
		}

		if (!this.isEnabled || this.commands.length === 0) {
			this.showOutputMessage();
			return;
		}

		var match = (pattern: string) => pattern && pattern.length > 0 && new RegExp(pattern).test(document.fileName);

		var commandConfigs = this.commands
			.filter(cfg => {
				var matchPattern = cfg.match || '';
				var negatePattern = cfg.notMatch || '';

				// if no match pattern was provided, or if match pattern succeeds
				var isMatch = matchPattern.length === 0 || match(matchPattern);

				// negation has to be explicitly provided
				var isNegate = negatePattern.length > 0 && match(negatePattern);

				// negation wins over match
				return !isNegate && isMatch;
			});

		if (commandConfigs.length === 0) {
			return;
		}

		this.showStatusMessage('Running on save commands...');

		// build our commands by replacing parameters with values
		var commands: Array<ICommand> = [];
		for (let cfg of commandConfigs) {
			var cmdStr = cfg.cmd;

			var extName = path.extname(document.fileName);

			var root = vscode.workspace.rootPath;
			var relativeFile = "." + document.fileName.replace(root, "");

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
				isAsync: !!cfg.isAsync
			});
		}

		//this._runCommands(commands);
		this.runAllInTerminal(commands);
	}
}
