import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
} from 'fs';

import { BuildExecutorSchema } from './schema';

import _ = require('underscore');

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const { projectHelmPath, outputPath } = options;
  const { projectName } = context;

  console.log('\n📁 Copying helm values files to the dist folder...');

  if (!existsSync(options.projectHelmPath)) {
    throw new Error(
      `The helm path specified for project ${projectName} does not exist.`
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
