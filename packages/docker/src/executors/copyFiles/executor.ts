import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

import { DockerCopyFilesExecutorSchema } from './schema';

export default async function runExecutor(
  options: DockerCopyFilesExecutorSchema,
  context: ExecutorContext
) {
  let { dockerFilePath, dockerIgnorePath, distPath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (distPath === undefined || distPath === '') {
    throw new Error('You must specify a dist path.');
  }

  if (dockerFilePath === undefined || dockerFilePath === '') {
    throw new Error('You must specify the dockerfile path.');
  }

  distPath = path.join(root, distPath);
  dockerFilePath = path.join(root, dockerFilePath);

  if (dockerIgnorePath != undefined) {
    dockerIgnorePath = path.join(root, dockerIgnorePath);
  }

  mkdirSync(distPath, { recursive: true });

  const dockerFileName = path.basename(dockerFilePath);
  const dockerFileDistPath = path.join(distPath, dockerFileName);
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
