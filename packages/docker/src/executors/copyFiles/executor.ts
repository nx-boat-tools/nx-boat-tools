import * as path from 'path';
import { ExecutorContext, readProjectConfiguration } from '@nrwl/devkit';
import { FsTree } from '@nrwl/tao/src/shared/tree';
import { copyFileSync, existsSync } from 'fs';

import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const tree = new FsTree(context.root, false);
  const projectConfig = readProjectConfiguration(tree, context.projectName);
  const projectDirectory = projectConfig.root;

  const dockerFilePath = path.join(projectDirectory, 'dockerfile');
  const dockerIgnorePath = path.join(projectDirectory, '.dockerignore');
  const dockerFileDistPath = path.join(options.distPath, 'dockerfile');
  const dockerIgnoreDistPath = path.join(options.distPath, '.dockerignore');

  console.log('\n📁 Copying docker files to the dist folder...');

  if (!existsSync(dockerFilePath)) {
    throw new Error(`${context.projectName} does not have a dockerfile.`);
  }

  console.log(`\t📄 ${dockerFilePath} -> ${dockerFileDistPath}`);

  copyFileSync(dockerFilePath, dockerFileDistPath);

  if (existsSync(dockerIgnorePath)) {
    console.log(`\t📄 ${dockerIgnorePath} -> ${dockerIgnoreDistPath}`);

    copyFileSync(dockerIgnorePath, dockerIgnoreDistPath);
  }

  return {
    success: true,
  };
}
