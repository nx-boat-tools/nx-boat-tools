import { Tree } from '@nrwl/devkit';

import dotnetGenerator from '../project/generator';
import { ConsoleAppGeneratorSchema } from './schema';
import { DotnetGeneratorSchema } from '../project/schema';

export default async function (tree: Tree, options: ConsoleAppGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    simpleModuleName: false,
    projectType: 'console',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
