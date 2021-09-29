import { Tree } from '@nrwl/devkit';
import * as _ from 'underscore';
import { ClassLibraryGeneratorSchema } from './schema';
import dotnetGenerator from '../project/generator';
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
