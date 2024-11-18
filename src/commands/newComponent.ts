import * as vscode from "vscode";
import { createDirectory, writeFile } from "../utils/fileSystem";
import { formatName, toKebabCase, toPascalCase } from "../utils/utils";

export function newComponentCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "nextReactUtils.newComponent",
    async (uri: vscode.Uri) => {
      // Solicitar o nome da página

      let componentName = await vscode.window.showInputBox({
        prompt: "Nome do componente",
        placeHolder: "Digite um nome",
      });

      if (!componentName) {
        return; // Se não houver nome, sai da função
      }

      componentName = toPascalCase(componentName);

      const folderPath = uri.fsPath;

      const filename = toKebabCase(componentName);

      try {
        // Criar a nova pasta
        const newFolderPath = `${folderPath}/${filename}`;
        await createDirectory(newFolderPath);

        await createDirectory(`${newFolderPath}/components`);

        // Criar o arquivo page.tsx

        const filePath = `${newFolderPath}/index.tsx`;
        const fileContent = `
type ${componentName}Props = {
  children?: React.ReactNode
};

export function ${componentName}({ ...props }: ${componentName}Props) {
  return <div>{props.children}</div>;
}
`;

        await writeFile(filePath, fileContent);

        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Erro: ${err.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}
