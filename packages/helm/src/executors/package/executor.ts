import { ExecutorContext } from '@nrwl/devkit';
import { spawnAsync } from '@nx-boat-tools/common';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import * as path from 'path';
import { PackageExecutorSchema } from './schema';

export default async function runExecutor(
  options: PackageExecutorSchema,
  context: ExecutorContext
) {
  const { projectHelmPath, outputPath } = options;
  const { projectName } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (projectHelmPath === undefined || projectHelmPath === '') {
    throw new Error('You must specify a project helm path.');
  }

  if (!existsSync(projectHelmPath)) {
    throw new Error(
      `Unable to locate helm path for project, '${projectHelmPath}'`
    );
  }

  if (outputPath === undefined || outputPath === '') {
    throw new Error('You must specify an output path.');
  }

  mkdirSync(outputPath, { recursive: true });

  const versionPath: string = path.join(outputPath, 'VERSION');
  const version = existsSync(versionPath)
    ? readFileSync(versionPath).toString()
    : undefined;

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
