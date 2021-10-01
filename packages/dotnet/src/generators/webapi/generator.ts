import { Tree } from '@nrwl/devkit';

import dotnetGenerator from '../project/generator';
import { DotnetGeneratorSchema } from '../project/schema';
import { WebApiGeneratorSchema } from './schema';

export default async function (tree: Tree, options: WebApiGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    projectType: 'webapi',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
