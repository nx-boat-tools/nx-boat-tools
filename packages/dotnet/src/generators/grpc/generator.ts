import { Tree } from '@nrwl/devkit';

import dotnetGenerator from '../project/generator';
import { DotnetGeneratorSchema } from '../project/schema';
import { GrpcAppGeneratorSchema } from './schema';

export default async function (tree: Tree, options: GrpcAppGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    projectType: 'grpc',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
