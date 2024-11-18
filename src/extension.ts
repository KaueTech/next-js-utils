import * as vscode from "vscode";
import { newPageCommand } from "./commands/newPage";
import { newComponentCommand } from "./commands/newComponent";
import { newRouteCommand } from "./commands/newRoute";

export function activate(context: vscode.ExtensionContext) {
  newPageCommand(context);
  newComponentCommand(context);
  newRouteCommand(context);
}

export function deactivate() {}
