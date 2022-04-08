import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { HelmInstallLocalChartExecutorSchema } from './schema';

import _ = require('underscore');

export default async function runExecutor(
  options: HelmInstallLocalChartExecutorSchema,
  context: ExecutorContext
) {
  let { projectHelmPath, valuesFilePaths } = options;
  const { dryRun } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (projectHelmPath === undefined || projectHelmPath === '') {
    throw new Error('You must specify a project helm path.');
  }

  valuesFilePaths =
    valuesFilePaths != undefined
      ? _.map(valuesFilePaths, (valuesFilePath) =>
          path.join(root, valuesFilePath)
        )
      : [];

  projectHelmPath = path.join(root, projectHelmPath);

  if (!existsSync(projectHelmPath)) {
    throw new Error(
      `Unable to locate helm path for project, '${projectHelmPath}'`
    );
  }

  console.log(`\n👷 Installing helm chart '${projectName}'...`);

  const args = ['-i'];

  _.each(valuesFilePaths, (valuesFilePath) => {
    args.push(`-f ${valuesFilePath}`);
  });

  if (dryRun == true) {
    args.push('--dry-run');
  }

  console.log('');
  console.log(
    await spawnAsync(
      `helm upgrade ${projectName} ${projectHelmPath}/chart ${args.join(' ')}`
    )
  );
  console.log(`🎉 Helm install complete!`);

  return { success: true };
}
