import { ExecutorContext } from '@nrwl/devkit';
import { spawnDetached } from '@nx-boat-tools/common';

import { HelmUninstallRepoChartExecutorSchema } from './schema';

export default async function runExecutor(
  options: HelmUninstallRepoChartExecutorSchema,
  context: ExecutorContext
) {
  const { resourceName, hostPort, containerPort } = options;
  const { projectName } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (resourceName === undefined) {
    throw new Error('No resource specified.');
  }

  if (hostPort === undefined) {
    throw new Error('No host port specified.');
  }

  if (containerPort === undefined) {
    throw new Error('No container port specified.');
  }

  console.log('');
  console.log(
    await spawnDetached(
      `kubectl port-forward ${resourceName} ${hostPort}:${containerPort}`
    )
  );
  console.log(`🎉 Helm port-forward complete!`);

  return { success: true };
}
