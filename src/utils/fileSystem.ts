import * as fs from "fs";
import * as vscode from "vscode";

export async function checkFileExists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

export function openExplorerFolder(path: string) {
  vscode.commands.executeCommand("revealFileInExplorer", vscode.Uri.file(path));
}

export function getWorkspace() {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
export function createDirectory(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function writeFile(
  filePath: string,
  content: string,
  overwrite: boolean = true
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err && !overwrite) {
        return reject(new Error(`Arquivo já existe: ${filePath}`));
      }

      fs.writeFile(filePath, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}
