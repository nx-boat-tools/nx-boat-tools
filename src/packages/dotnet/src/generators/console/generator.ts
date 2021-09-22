import { Tree } from '@nrwl/devkit';
import * as _ from 'underscore';
import { ConsoleAppGeneratorSchema } from './schema';
import dotnetGenerator from '../project/generator'
import { DotnetGeneratorSchema } from '../project/schema';

export default async function (tree: Tree, options: ConsoleAppGeneratorSchema) {
  const dotnetOptions: DotnetGeneratorSchema = {
    ...options,
    simpleModuleName: false,
    projectType: 'console'
  }
  await dotnetGenerator(tree, dotnetOptions)
}