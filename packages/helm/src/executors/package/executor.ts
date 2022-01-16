import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync, mkdirSync } from 'fs';
import { getVersionForProject, spawnAsync } from '@nx-boat-tools/common';

import { HelmPackageExecutorSchema } from './schema';

export default async function runExecutor(
  options: HelmPackageExecutorSchema,
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

  if (!existsSync(projectHelmPath)) {
    throw new Error(
      `Unable to locate helm path for project, '${projectHelmPath}'`
    );
  }

  mkdirSync(outputPath, { recursive: true });

  const projectPath: string = path.join(
    root,
    context.workspace.projects[projectName].root
  );
  const version = getVersionForProject(projectPath, false);

  let args = `-d ${outputPath}`;

  console.log(`\n📦 Packaging helm chart '${projectName}'...`);

  if (version !== undefined) {
    args += ` --version ${version}`;

    console.log(`\t🏷  Using detected version of ${version}...`);
  }

  console.log('');
  console.log(
    await spawnAsync(`helm package ${projectHelmPath}/chart ${args}`)
  );
  console.log(`🎉 Helm package complete!`);

  return { success: true };
}
