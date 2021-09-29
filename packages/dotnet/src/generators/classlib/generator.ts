import { Tree } from '@nrwl/devkit';

import dotnetGenerator from '../project/generator';
import { ClassLibraryGeneratorSchema } from './schema';
import { DotnetGeneratorSchema } from '../project/schema';

export default async function (
  tree: Tree,
  options: ClassLibraryGeneratorSchema
) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    simpleModuleName: false,
    projectType: 'classlib',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
