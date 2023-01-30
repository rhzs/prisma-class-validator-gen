import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { OptionalKind, Project, PropertyDeclarationStructure } from 'ts-morph';
import {
  generateClassTransformerImport,
  generateClassValidatorImport,
  generateEnumImports,
  generateHelpersImports,
  generatePrismaImport,
  generateRelationImportsImport,
  getDecoratorsByFieldType,
  getDecoratorsImportsByType,
  getTransformerDecoratorsImportsByType,
  getTSDataTypeFromFieldType,
  shouldImportHelpers,
  shouldImportPrisma,
} from './helpers';

export default async function generateClass(
  project: Project,
  outputDir: string,
  model: PrismaDMMF.Model,
) {
  const dirPath = path.resolve(outputDir, 'entities');
  const filePath = path.resolve(dirPath, `${model.name}.ts`);
  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  });

  if (shouldImportPrisma(model.fields)) {
    generatePrismaImport(sourceFile);
  }

  const transformerImports = [
    ...new Set(
      model.fields
        .map((field) => getTransformerDecoratorsImportsByType(field))
        .flatMap((item) => item),
    ),
  ];
  generateClassTransformerImport(
    sourceFile,
    transformerImports as Array<string>,
  );

  const validatorImports = [
    ...new Set(
      model.fields
        .map((field) => getDecoratorsImportsByType(field))
        .flatMap((item) => item),
    ),
  ];
  generateClassValidatorImport(sourceFile, validatorImports as Array<string>);

  const relationImports = new Set();
  model.fields.forEach((field) => {
    if (field.relationName && model.name !== field.type) {
      relationImports.add(field.type);
    }
  });
  generateRelationImportsImport(sourceFile, [
    ...relationImports,
  ] as Array<string>);

  if (shouldImportHelpers(model.fields)) {
    generateHelpersImports(sourceFile, ['getEnumValues']);
  }

  generateEnumImports(sourceFile, model.fields);

  sourceFile.addClass({
    name: model.name,
    isExported: true,
    properties: [
      ...model.fields.map<OptionalKind<PropertyDeclarationStructure>>(
        (field: PrismaDMMF.Field) => {
          // force object to be optional
          // useful for DATABASE without Foreign Key concept
          if (field.kind === 'object') {
            field.isRequired = false;
          }

          return {
            name: field.name,
            type: getTSDataTypeFromFieldType(field),
            hasExclamationToken: field.isRequired,
            hasQuestionToken: !field.isRequired,
            trailingTrivia: '\r\n',
            decorators: getDecoratorsByFieldType(field),
          };
        },
      ),
    ],
  });
}
