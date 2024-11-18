import * as vscode from "vscode";
import { createDirectory, writeFile } from "../utils/fileSystem";
import {
  formatName,
  showQuickPickFields,
  toKebabCase,
  toPascalCase,
} from "../utils/utils";

export function newPageCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "nextReactUtils.newPage",
    async (uri: vscode.Uri) => {
      // Solicitar o nome da rota da página
      let pageName = await vscode.window.showInputBox({
        prompt: "Digite o nome da página",
        placeHolder: "ex: users",
      });

      if (!pageName) {
        vscode.window.showErrorMessage("O nome da página é obrigatório.");
        return;
      }

      pageName = toPascalCase(pageName);

      if (!pageName?.endsWith("Page")) {
        pageName += "Page";
      }

      const collectedData = await showQuickPickFields([
        {
          label: "Título",
          key: "pageTitle",
          defaultValue: `${pageName.split("Page")[0]} Page`,
          picked: true,
        },
        {
          label: "Descrição",
          key: "pageDescription",
          defaultValue: `Next.JS Page`,
          picked: true,
        },
      ]);

      if (!collectedData) {
        return;
      }

      const { pageTitle, pageDescription } = collectedData as any;

      const folderPath = uri.fsPath;

      const filename = toKebabCase(pageName.split("Page")[0]);

      try {
        // Criar a nova pasta
        const newFolderPath = `${folderPath}/${filename}`;
        await createDirectory(newFolderPath);
        await createDirectory(`${newFolderPath}/components`);

        // Criar o arquivo page.tsx
        const filePath = `${newFolderPath}/page.tsx`;
        const fileContent = `
import { Metadata } from 'next';

type ${pageName}Props = {
  params: Promise<{
        id: string;
  }>;
};

export default async function ${pageName}({ ...props }: ${pageName}Props) {
  const { id } = await props.params;
  return <div>${pageName}</div>;
}

export const metadata: Metadata = {
  title: '${pageTitle}',
  description: '${pageDescription}',
};`;

        await writeFile(filePath, fileContent);

        // Abrir o arquivo recém-criado
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Erro: ${err.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}
