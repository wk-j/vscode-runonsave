import * as path from "path";
import * as vscode from "vscode";
import { workspace } from "vscode"
import { Executor } from "./executor";

export interface ICommand {
    match?: string;
    notMatch?: string;
    cmd: string;
    isAsync: boolean;
    useShortcut?: boolean;
    silent?: boolean;
}

interface IConfig {
    shell: string;
    autoClearConsole: boolean;
    commands: ICommand[];
}

export class RunOnSaveExtension {
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel("Save and Run");
    }

    private runInTerminal(command, name) {
        let editor = vscode.window.activeTextEditor
        let column = editor.viewColumn;
        Executor.runInTerminal(command, name)
    }

    private runAllInTerminal(commands: ICommand[], terminalName): void {
        commands.forEach(command => {
            this.runInTerminal(command, terminalName);
        });
    }

    public get isEnabled(): boolean {
        return this.context.globalState.get("isEnabled", true);
    }
    public set isEnabled(value: boolean) {
        this.context.globalState.update("isEnabled", value);
        this.showOutputMessage();
    }

    private loadConfig() {
        let config = vscode.workspace.getConfiguration("saveAndRun") as any as IConfig;
        return config;
    }

    public showOutputMessage(message?: string): void {
        message = message || `Save and Run ${this.isEnabled ? "enabled" : "disabled"}.`;
        this.outputChannel.appendLine(message);
    }

    public showStatusMessage(message: string): vscode.Disposable {
        this.showOutputMessage(message);
        return vscode.window.setStatusBarMessage(message);
    }

    private getWorkspaceFolder() {
        const editor = vscode.window.activeTextEditor;
        const resource = editor.document.uri;
        const rootFolder = workspace.getWorkspaceFolder(resource);
        return rootFolder
    }

    private findActiveCommands(config: IConfig, document: vscode.TextDocument, onlyShortcut: boolean) {
        let match = (pattern: string) => pattern && pattern.length > 0 && new RegExp(pattern).test(document.fileName);
        let commandConfigs = config.commands
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

            const rootFolder = this.getWorkspaceFolder();
            const root = rootFolder.uri.path;

            let relativeFile = "." + document.fileName.replace(root, "");
            cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
            cmdStr = cmdStr.replace(/\${workspaceFolder}/g, root);
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
                silent: cfg.silent,
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
        let config = this.loadConfig();
        if (config.autoClearConsole) {
            this.outputChannel.clear();
        }

        if (!this.isEnabled || config.commands.length === 0) {
            this.showOutputMessage();
            return;
        }

        let commands = this.findActiveCommands(config, document, onlyShortcut);
        let terminalName = this.getWorkspaceFolder().name

        this.runAllInTerminal(commands, `Run ${terminalName}`);
    }
}