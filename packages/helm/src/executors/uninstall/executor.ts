import { ExecutorContext } from '@nrwl/devkit';
import { spawnAsync } from '@nx-boat-tools/common';

import { HelmUninstallRepoChartExecutorSchema } from './schema';

export default async function runExecutor(
  options: HelmUninstallRepoChartExecutorSchema,
  context: ExecutorContext
) {
  const { dryRun } = options;
  const { projectName } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  const args = dryRun === true ? ' --dry-run' : '';

  console.log('');
  console.log(await spawnAsync(`helm uninstall ${projectName}${args}`));
  console.log(`🎉 Helm uninstall complete!`);

  return { success: true };
}
