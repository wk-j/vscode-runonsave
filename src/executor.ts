import * as vscode from "vscode";
import { ICommand } from "./runner";

export class Executor {
    public static runInTerminal(command: ICommand, terminal: string): void {
        if (this.terminals[terminal] === undefined) {
            const term = vscode.window.createTerminal(terminal)
            this.terminals[terminal] = term
        }

        if (command.silent !== true) {
            this.terminals[terminal].show()
        }
        this.terminals[terminal].sendText(command.cmd)

        setTimeout(() => {
            vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup")
        }, 100)
    }

    public static onDidCloseTerminal(closedTerminal: vscode.Terminal): void {
        delete this.terminals[closedTerminal.name]
    }

    private static terminals: { [id: string]: vscode.Terminal } = {}
}