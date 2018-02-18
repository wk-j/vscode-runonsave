import * as vscode from "vscode";

export class Executor {
    public static runInTerminal(command: string, terminal: string = "Save & Run"): void {
        if (this.terminals[terminal] === undefined) {
            const term = vscode.window.createTerminal(terminal)
            this.terminals[terminal] = term
        }
        this.terminals[terminal].show()
        this.terminals[terminal].sendText(command)

        setTimeout(() => {
            vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup")
        }, 100)
    }

    public static onDidCloseTerminal(closedTerminal: vscode.Terminal): void {
        delete this.terminals[closedTerminal.name]
    }

    private static terminals: { [id: string]: vscode.Terminal } = {}
}