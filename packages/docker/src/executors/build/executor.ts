import { ExecutorContext } from '@nrwl/devkit';
import { spawnAsync } from '@nx-boat-tools/common';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const { buildPath } = options;
  const { projectName } = context;
  const dockerFilePath = path.join(options.buildPath, 'dockerfile');

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (!existsSync(buildPath)) {
    throw new Error('The build path specified cannot be found.');
  }

  if (!existsSync(dockerFilePath)) {
    throw new Error(
      'A dockerfile could not be found in the specified build directory.'
    );
  }

  console.log(`\n🔨 Building docker image '${projectName}'...\n`);
  console.log(
    await spawnAsync(
      `docker build -t ${projectName}:latest -f ${dockerFilePath} ${buildPath}`
    )
  );

  const versionPath: string = path.join(options.buildPath, 'VERSION');
  const version = existsSync(versionPath)
    ? readFileSync(versionPath).toString()
    : undefined;

  if (version !== undefined) {
    console.log(
      `\n🏷 Tagging image with version '${projectName}:${version}'...\n`
    );
    console.log(
      await spawnAsync(
        `docker tag ${projectName}:latest ${projectName}:${version}`
      )
    );
  }

  console.log(`🎉 Docker build complete!`);

  return { success: true };
}
