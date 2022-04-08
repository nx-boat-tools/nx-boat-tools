import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { HelmLintExecutorSchema } from './schema';

export default async function runExecutor(
  options: HelmLintExecutorSchema,
  context: ExecutorContext
) {
  let { projectHelmPath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (projectHelmPath === undefined || projectHelmPath === '') {
    throw new Error('You must specify a project helm path.');
  }

  projectHelmPath = path.join(root, projectHelmPath);

  if (!existsSync(projectHelmPath)) {
    throw new Error(
      `Unable to locate helm path for project, '${projectHelmPath}'`
    );
  }

  console.log(`\n🧼️ Linting helm chart '${projectName}'...`);

  const args = `--strict`;

  console.log('');
  console.log(await spawnAsync(`helm lint ${projectHelmPath}/chart ${args}`));
  console.log(`🎉 Helm lint complete!`);

  return { success: true };
}
