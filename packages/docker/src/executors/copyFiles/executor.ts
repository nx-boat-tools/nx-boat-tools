import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

import { DockerCopyFilesExecutorSchema } from './schema';

export default async function runExecutor(
  options: DockerCopyFilesExecutorSchema,
  context: ExecutorContext
) {
  let { distPath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (distPath === undefined || distPath === '') {
    throw new Error('You must specify a dist path.');
  }

  distPath = path.join(root, distPath);

  mkdirSync(distPath, { recursive: true });

  const dockerFilePath = path.join(root, 'dockerfile');
  const dockerIgnorePath = path.join(root, '.dockerignore');
  const dockerFileDistPath = path.join(distPath, 'dockerfile');
  const dockerIgnoreDistPath = path.join(distPath, '.dockerignore');

  console.log('\n📁 Copying docker files to the dist folder...');

  if (!existsSync(dockerFilePath)) {
    throw new Error(`${projectName} does not have a dockerfile.`);
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
