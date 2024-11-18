import * as vscode from "vscode";

export function formatName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

type Field = {
  label: string;
  key: string;
  defaultValue?: string;
  placeholder?: string;
  picked?: boolean;
};

export function toKebabCase(input: string): string {
  return input
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Coloca hífen entre letras minúsculas e maiúsculas
    .toLowerCase(); // Converte tudo para minúsculas
}

export function toPascalCase(input: string): string {
  return input
    .replace(/[\s\-]+/g, " ") // Substitui hífens e espaços por um único espaço
    .replace(/(?:^|\s)(\w)/g, (_, match) => match.toUpperCase()) // Converte a primeira letra de cada palavra para maiúscula
    .replace(/\s+/g, ""); // Remove espaços extras, se houver
}

export async function showQuickPickFields(fields: Field[]) {
  // Mostrar QuickPick para selecionar quais campos preencher
  let selectedFields = await vscode.window.showQuickPick(
    fields.map((field) => ({
      label: `${field.label}${
        field.defaultValue ? ` ( ${field.defaultValue} )` : ""
      }`,
      fieldKey: field.key,
      defaultValue: field.defaultValue,
      picked: !!field.picked,
    })),
    {
      canPickMany: true,
      placeHolder: "Selecione os campos a preencher",
    }
  );

  if (!selectedFields) {
    selectedFields = [];
  }

  // Coletar os valores dos campos selecionados
  const collectedData: Record<string, string> = {};

  for (const field of fields) {
    if (
      selectedFields.some(
        (selectedField) => selectedField.fieldKey === field.key
      )
    ) {
      const userInput = await vscode.window.showInputBox({
        prompt: `Digite o valor para ${field.label}`,
        placeHolder: field.defaultValue, // Sugere o valor padrão
      });

      // Armazena o valor digitado ou o padrão
      collectedData[field.key] = userInput || field.defaultValue || "";
    } else {
      collectedData[field.key] = field.defaultValue || "";
    }
  }

  return collectedData;
}
