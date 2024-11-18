import * as vscode from "vscode";
import * as path from "path";
import { toKebabCase, toPascalCase } from "../utils/utils";
import {
  generateApiUtilsFile,
  generateRouteFile,
  generateRouteMethodFile,
} from "../utils/newRouteUtils";
import {
  getWorkspace,
  checkFileExists,
  openExplorerFolder,
} from "../utils/fileSystem";

import * as fs from "fs/promises";

export enum RouteMethod {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",
}

// Função principal que registra o comando da extensão
export function newRouteCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "nextReactUtils.newRoute",
    async (uri: vscode.Uri) => {
      try {
        const workspaceFolder = getWorkspace();

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("Nenhum workspace aberto.");
          return;
        }

        let folderPath = uri.fsPath;

        // Verifica se o usuário clicou na pasta 'methods' e ajusta o caminho
        if (path.basename(folderPath) === "methods") {
          folderPath = path.dirname(folderPath); // Define o folderPath como a pasta pai
        }

        const methodPath = `${folderPath}/methods`;

        const { createdMethods, availableMethods } = await findCreatedMethods(
          methodPath
        );

        const routeFilePath = `${folderPath}/route.ts`;
        const existsRouteFile = await checkFileExists(routeFilePath);

        if (availableMethods.length === 0 && existsRouteFile) {
          vscode.window.showInformationMessage("Todos os métodos já existem.");
          return;
        }

        const selectedMethods = await selectMethodsToCreate(availableMethods);

        if (existsRouteFile && selectedMethods.length === 0) {
          vscode.window.showInformationMessage("Nenhum método selecionado.");
          return;
        }

        const routeNameByFile = await getRouteNameFromFile(
          folderPath,
          createdMethods
        );
        const routeName = await getRouteName(routeNameByFile || "");

        await generateApiUtilsFile(workspaceFolder);

        for (const method of selectedMethods) {
          await generateRouteMethodFile(methodPath, routeName, method);
        }

        await generateRouteFile(folderPath, routeName, [
          ...createdMethods,
          ...selectedMethods,
        ]);

        const document = await vscode.workspace.openTextDocument(routeFilePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage("Rotas criadas com sucesso!");
      } catch (err: any) {
        vscode.window.showErrorMessage(`Erro: ${err.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function findCreatedMethods(methodPath: string) {
  const allMethods = Object.values(RouteMethod); // Obtém todos os métodos do enum

  // Verifica os métodos criados de forma assíncrona
  const results = await Promise.all(
    allMethods.map(async (method) => {
      const exists = await checkFileExists(`${methodPath}/${method}.ts`);
      return { method, exists };
    })
  );

  const createdMethods = results
    .filter((result) => result.exists)
    .map((result) => result.method);

  const availableMethods = results
    .filter((result) => !result.exists)
    .map((result) => result.method);

  return { availableMethods, createdMethods };
}

// Função para mostrar a seleção de métodos disponíveis
async function selectMethodsToCreate(methods: RouteMethod[]) {
  if (!methods || methods.length === 0) {
    return [];
  }

  const selections = await vscode.window.showQuickPick(
    methods.map((method) => ({
      label: method.toString(),
      value: method,
      picked: true, // Pré-seleciona todos os métodos
    })),
    {
      canPickMany: true,
      title: "Selecione os métodos a serem criados",
    }
  );

  return selections?.map((selection) => selection.value) || [];
}

// Função para criar o nome da rota a partir do nome do diretório
async function getRouteName(defaultValue?: string): Promise<string> {
  let routeName = await vscode.window.showInputBox({
    prompt: "Nome da rota da API",
    placeHolder: "ex: users",
    value: defaultValue,
  });

  if (!routeName) {
    throw new Error("O nome da rota é obrigatório.");
  }

  return toPascalCase(routeName);
}

async function getRouteNameFromFile(
  folderPath: string,
  createdMethods: RouteMethod[]
): Promise<string | null> {
  try {
    // Primeiro, tenta extrair do arquivo route.ts
    const routeFilePath = path.join(folderPath, "route.ts");

    if (await checkFileExists(routeFilePath)) {
      const routeContent = await fs.readFile(routeFilePath, "utf-8");
      const routeMatch = routeContent.match(/export\s+type\s+(\w+)RouteParams/);

      if (routeMatch && routeMatch[1]) {
        return routeMatch[1]; // Nome da rota extraído de route.ts
      }
    }

    // Se não encontrar em route.ts, tenta nos arquivos de métodos
    for (const method of createdMethods) {
      const methodFilePath = path.join(folderPath, "methods", `${method}.ts`);

      if (await checkFileExists(methodFilePath)) {
        const methodContent = await fs.readFile(methodFilePath, "utf-8");

        // Busca por qualquer nome que termina com MethodProps
        const methodMatch = methodContent.match(/\b(\w+)RouteParams\b/);

        if (methodMatch && methodMatch[1]) {
          return methodMatch[1]; // Nome da rota extraído de um método
        }
      }
    }

    return null; // Nenhum nome de rota encontrado
  } catch (err) {
    console.error(`Erro ao buscar o nome da rota: ${(err as Error).message}`);
    return null;
  }
}
