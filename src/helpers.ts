import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import {
  ExportDeclarationStructure,
  OptionalKind,
  SourceFile,
  DecoratorStructure,
  Project,
} from 'ts-morph';

export const generateModelsIndexFile = (
  prismaClientDmmf: PrismaDMMF.Document,
  project: Project,
  outputDir: string,
  modelDir: string = 'models',
) => {
  const modelsBarrelExportSourceFile = project.createSourceFile(
    path.resolve(outputDir, modelDir, 'index.ts'),
    undefined,
    { overwrite: true },
  );

  modelsBarrelExportSourceFile.addExportDeclarations(
    prismaClientDmmf.datamodel.models
      .map((model) => model.name)
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>((modelName) => ({
        moduleSpecifier: `./${modelName}`,
        namedExports: [modelName],
      })),
  );
};

export const shouldImportPrisma = (fields: PrismaDMMF.Field[]) => {
  return fields.some((field) => ['Json'].includes(field.type));
};

export const shouldImportHelpers = (fields: PrismaDMMF.Field[]) => {
  return fields.some((field) => ['enum'].includes(field.kind));
};

export const getTSDataTypeFromFieldType = (field: PrismaDMMF.Field) => {
  let type = field.type;
  switch (field.type) {
    case 'Int':
    case 'Float':
      type = 'number';
      break;
    case 'DateTime':
      type = 'Date';
      break;
    case 'String':
      type = 'string';
      break;
    case 'Boolean':
      type = 'boolean';
      break;
    case 'Decimal':
      type = 'number';
      break;
    case 'Json':
      type = 'Prisma.JsonValue';
      break;
    default:
      if (field.isList) {
        type = `${field.type}[]`;
      }
  }
  return type;
};

export const getDecoratorsByFieldType = (field: PrismaDMMF.Field) => {
  const decorators: OptionalKind<DecoratorStructure>[] = [];
  switch (field.type) {
    case 'Int':
      decorators.push({
        name: 'IsInt',
        arguments: [],
      });
      break;
    case 'DateTime':
      decorators.push({
        name: 'IsDate',
        arguments: [],
      });
      break;
    case 'String':
      decorators.push({
        name: 'IsString',
        arguments: [],
      });
      break;
    case 'Boolean':
      decorators.push({
        name: 'IsBoolean',
        arguments: [],
      });
      break;
  }
  if (field.isRequired) {
    decorators.unshift({
      name: 'IsDefined',
      arguments: [],
    });
  } else {
    decorators.unshift({
      name: 'IsOptional',
      arguments: [],
    });
  }
  if (field.type === 'Decimal') {
    decorators.unshift({
      name: 'Type',
      arguments: ['() => Number'],
    });
  }
  if (field.kind === 'enum') {
    decorators.push({
      name: 'IsIn',
      arguments: [`getEnumValues(${String(field.type)})`],
    });
  }
  return decorators;
};

export const getDecoratorsImportsByType = (field: PrismaDMMF.Field) => {
  const validatorImports = new Set();
  switch (field.type) {
    case 'Int':
      validatorImports.add('IsInt');
      break;
    case 'DateTime':
      validatorImports.add('IsDate');
      break;
    case 'String':
      validatorImports.add('IsString');
      break;
    case 'Boolean':
      validatorImports.add('IsBoolean');
      break;
  }
  if (field.isRequired) {
    validatorImports.add('IsDefined');
  } else {
    validatorImports.add('IsOptional');
  }
  if (field.kind === 'enum') {
    validatorImports.add('IsIn');
  }
  return [...validatorImports];
};

export const getTransformerDecoratorsImportsByType = (
  field: PrismaDMMF.Field,
) => {
  const transformerImports = new Set();
  switch (field.type) {
    case 'Decimal':
      transformerImports.add('Type');
      break;
  }
  return [...transformerImports];
};

export const generateClassValidatorImport = (
  sourceFile: SourceFile,
  validatorImports: Array<string>,
) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'class-validator',
    namedImports: validatorImports,
  });
};

export const generateClassTransformerImport = (
  sourceFile: SourceFile,
  validatorImports: Array<string>,
) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'class-transformer',
    namedImports: validatorImports,
  });
};

export const generatePrismaImport = (sourceFile: SourceFile) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: ['Prisma'],
  });
};

export const generateRelationImportsImport = (
  sourceFile: SourceFile,
  relationImports: Array<string>,
) => {
  if (relationImports.length) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: './',
      namedImports: relationImports,
    });
  }
};
export const generateHelpersImports = (
  sourceFile: SourceFile,
  helpersImports: Array<string>,
) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: '../helpers',
    namedImports: helpersImports,
  });
};

export const generateEnumImports = (
  sourceFile: SourceFile,
  fields: PrismaDMMF.Field[],
) => {
  const enumsToImport = fields
    .filter((field) => field.kind === 'enum')
    .map((field) => field.type);

  if (enumsToImport.length > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: '../enums',
      namedImports: enumsToImport,
    });
  }
};

export function generateEnumsIndexFile(
  sourceFile: SourceFile,
  enumNames: string[],
) {
  sourceFile.addExportDeclarations(
    enumNames.sort().map<OptionalKind<ExportDeclarationStructure>>((name) => ({
      moduleSpecifier: `./${name}`,
      namedExports: [name],
    })),
  );
}
