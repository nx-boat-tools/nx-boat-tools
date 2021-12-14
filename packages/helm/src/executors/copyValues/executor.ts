import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
} from 'fs';

import { HelmCopyValuesExecutorSchema } from './schema';

import * as _ from 'underscore';

export default async function runExecutor(
  options: HelmCopyValuesExecutorSchema,
  context: ExecutorContext
) {
  let { projectHelmPath, outputPath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (projectHelmPath === undefined || projectHelmPath === '') {
    throw new Error('You must specify a project helm path.');
  }

  if (outputPath === undefined || outputPath === '') {
    throw new Error('You must specify an output path.');
  }

  projectHelmPath = path.join(root, projectHelmPath);
  outputPath = path.join(root, outputPath);

  console.log('\n📁 Copying helm values files to the dist folder...');

  if (!existsSync(projectHelmPath)) {
    throw new Error(
      `Unable to locate helm path for project, '${projectHelmPath}'`
    );
  }

  mkdirSync(outputPath, { recursive: true });

  const files = readdirSync(projectHelmPath);

  _.each(files, (file) => {
    const srcFilePath = path.join(projectHelmPath, file);
    const outFilePath = path.join(outputPath, file);

    if (lstatSync(srcFilePath).isDirectory()) return;

    console.log(`\t📄 ${srcFilePath} -> ${outFilePath}`);

    copyFileSync(srcFilePath, outFilePath);
  });

  return {
    success: true,
  };
}
