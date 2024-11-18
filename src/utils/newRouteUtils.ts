import { METHODS } from "http";
import { createDirectory, writeFile } from "./fileSystem";
import { toPascalCase } from "./utils";
import { RouteMethod } from "../commands/newRoute";

const api_filename = "nextApiUtils";

export async function generateRouteMethodFile(
  folderPath: string,
  routeName: string,
  method: RouteMethod
) {
  const filename = `${folderPath}/${method}.ts`;
  const isGet = method === RouteMethod.GET;
  const methodName = method
    .toLowerCase()
    .replace(/^(.)/, (match, p1) => p1.toUpperCase());

  await createDirectory(folderPath);

  const Schema = `${methodName}${routeName}${isGet ? "Params" : "Body"}Schema`;
  const Response = `${methodName}${routeName}Response`;
  const RouteParams = `${routeName}RouteParams`;
  const MethodProps = `${methodName}${routeName}Props`;
  const Imports = isGet
    ? "getSearchParams, MethodResponse, success"
    : "MethodResponse, success";

  await writeFile(
    filename,
    `
import { NextRequest, NextResponse } from 'next/server';
import { ${RouteParams} } from '../route';
import { z } from 'zod';
import { ${Imports} } from '@/utils/${api_filename}';

const ${Schema} = z.object({
  page: z.coerce.number().min(1).default(1)
});

type ${MethodProps} = {
    params: ${RouteParams}
}

export type ${Response} = MethodResponse & {
  example: string;
};

export async function ${method}(
  request: NextRequest,
  props: ${MethodProps},
): Promise<NextResponse<${Response}>> {
  const params = await props.params;
${
  isGet
    ? `
  const rawData = getSearchParams(request);
  const data = await ${Schema}.parseAsync(rawData);
    `
    : `
  const rawBody = await request.json();
  const body = await ${Schema}.parseAsync(rawBody);
    `
}
  return success({ example: 'Hello World' });
}
    `
  );
}

export async function generateRouteFile(
  folderPath: string,
  routeName: string,
  methods: RouteMethod[]
) {
  const filename = `${folderPath}/route.ts`;
  const RouteProps = `${routeName}RouteProps`;
  const RouteParams = `${routeName}RouteParams`;

  await createDirectory(folderPath);

  // Gerar dinamicamente as importações e exportações dos métodos selecionados
  const imports = methods
    .map(
      (method) =>
        `import { ${method} as _${method.toLowerCase()} } from './methods/${method}';`
    )
    .join("\n");

  const exports = methods
    .map(
      (method) =>
        `const ${method} = HTTPMethod(_${method.toLowerCase()}, schema);`
    )
    .join("\n");

  const methodExports = methods.join(", ");

  await writeFile(
    filename,
    `
import { HTTPMethod } from '@/utils/${api_filename}';
import { z } from 'zod';

const schema = z.object({});

export type ${RouteParams} = z.infer<typeof schema>;

type ${RouteProps} = {
  params?: Promise<${RouteParams}>;
};

${imports}

${exports}

export { ${methodExports} };
`
  );
}

export async function generateApiUtilsFile(workspaceFolder: string) {
  const folderpath = `${workspaceFolder}/src/utils`;
  await createDirectory(folderpath);
  await writeFile(
    `${folderpath}/${api_filename}.ts`,
    `
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export type MethodResponse = {
  errors?: z.ZodIssue[];
  message?: string;
};

type MethodPromise = Promise<NextResponse<MethodResponse>>;

export function HTTPMethod(
  callback: (
    request: NextRequest,
    props: { params: any },
  ) => MethodPromise,
  schema?: z.ZodObject<any>,
) {
  return async (
    request: NextRequest,
    props: { params: Promise<any> },
  ): MethodPromise => {
    try {
      if (schema) {
        const params = await props.params;
        await schema.parseAsync(params);
      }

      return await callback(request, { params });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return zodError(error.errors);
      }

      return internalError((error as Error).message);
    }
  };
}

export function getSearchParams(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

export function zodError(errors: z.ZodIssue[]): NextResponse<MethodResponse> {
  return response(400, {
    message: 'Parametros inválidos!',
    errors,
  });
}

export function unauthorized(message: string = 'Acesso não autorizado!') {
  return response(401, { message });
}

export function notFound(message: string = 'Nenhum resultado foi encontrado!') {
  return response(404, { message });
}

export function badRequest(message: string = 'A requisição está mal formada!') {
  return response(400, { message });
}

export function internalError(
  message: string = 'Ocorreu um erro interno no servidor!',
) {
  return response(500, { message });
}

export function success<T>(data: T): NextResponse<T | any> {
  return response(200, data);
}

export function response<T>(status: number, data: T): NextResponse<T | any> {
  return NextResponse.json(data, { status });
}

`
  );
}
