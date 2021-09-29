import { Tree } from '@nrwl/devkit';
import { WebApiGeneratorSchema } from './schema';
import dotnetGenerator from '../project/generator';
import { DotnetGeneratorSchema } from '../project/schema';

export default async function (tree: Tree, options: WebApiGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    simpleModuleName: false,
    projectType: 'webapi',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
