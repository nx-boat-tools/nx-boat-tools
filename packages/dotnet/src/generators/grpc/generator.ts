import { Tree } from '@nrwl/devkit';

import dotnetGenerator from '../project/generator';
import { GrpcAppGeneratorSchema } from './schema';
import { DotnetGeneratorSchema } from '../project/schema';

export default async function (tree: Tree, options: GrpcAppGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    projectType: 'grpc',
  };
  await dotnetGenerator(tree, dotnetOptions);
}
