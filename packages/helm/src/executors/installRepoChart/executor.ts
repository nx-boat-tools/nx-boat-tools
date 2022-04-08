import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { spawnAsync } from '@nx-boat-tools/common';

import { HelmInstallRepoChartExecutorSchema } from './schema';

import _ = require('underscore');

export default async function runExecutor(
  options: HelmInstallRepoChartExecutorSchema,
  context: ExecutorContext
) {
  let { valuesFilePaths } = options;
  const { repository, chart, dryRun } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (repository === undefined || repository === '') {
    throw new Error('You must specify a repository.');
  }

  if (chart === undefined || chart === '') {
    throw new Error('You must specify a chart name.');
  }

  valuesFilePaths =
    valuesFilePaths != undefined
      ? _.map(valuesFilePaths, (valuesFilePath) =>
          path.join(root, valuesFilePath)
        )
      : [];

  console.log(`\n👷 Installing helm chart '${repository}/${chart}'...`);

  const args = ['-i --verify'];

  _.each(valuesFilePaths, (valuesFilePath) => {
    args.push(`-f ${valuesFilePath}`);
  });

  if (dryRun == true) {
    args.push('--dry-run');
  }

  console.log('');
  console.log(
    await spawnAsync(
      `helm upgrade ${projectName} ${repository}/${chart} ${args.join(' ')}`
    )
  );
  console.log(`🎉 Helm install complete!`);

  return { success: true };
}
