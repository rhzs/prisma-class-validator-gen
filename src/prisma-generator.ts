import { parseEnvValue, getDMMF } from '@prisma/internals';
import { EnvValue, GeneratorOptions } from '@prisma/generator-helper';
import { promises as fs } from 'fs';
import path from 'path';
import removeDir from './utils/removeDir';
import generateClass from './generate-class';
import { generateEnumsIndexFile, generateModelsIndexFile } from './helpers';
import { project } from './project';
import generateEnum from './generate-enum';
import { generateHelpersIndexFile } from './generate-helpers';

export async function generate(options: GeneratorOptions) {
  const outputDir = parseEnvValue(options.generator.output as EnvValue);
  await fs.mkdir(outputDir, { recursive: true });
  await removeDir(outputDir, true);

  const prismaClientProvider = options.otherGenerators.find(
    (it) => parseEnvValue(it.provider) === 'prisma-client-js',
  );

  const prismaClientDmmf = await getDMMF({
    datamodel: options.datamodel,
    previewFeatures: prismaClientProvider?.previewFeatures,
  });

  const enumNames = new Set<string>();
  prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
    enumNames.add(enumItem.name);
    generateEnum(project, outputDir, enumItem);
  });

  if (enumNames.size > 0) {
    let enumDir = parseEnvValue(options.generator.enumDir as EnvValue);
    if (!enumDir) {
      enumDir = "enums";
    }

    const enumsIndexSourceFile = project.createSourceFile(
      path.resolve(outputDir, enumDir, 'index.ts'),
      undefined,
      { overwrite: true },
    );
    generateEnumsIndexFile(enumsIndexSourceFile, [...enumNames]);
  }

  prismaClientDmmf.datamodel.models.forEach((model) =>
    generateClass(project, outputDir, model),
  );

  const helpersIndexSourceFile = project.createSourceFile(
    path.resolve(outputDir, 'helpers', 'index.ts'),
    undefined,
    { overwrite: true },
  );
  generateHelpersIndexFile(helpersIndexSourceFile);

  let modelDir = parseEnvValue(options.generator.modelDir as EnvValue);
  if (!modelDir) {
    modelDir = 'models';
  }

  generateModelsIndexFile(prismaClientDmmf, project, outputDir, modelDir);
  await project.save();
}
