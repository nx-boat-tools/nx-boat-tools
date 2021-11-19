import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync, readFileSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  let { buildPath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (buildPath === undefined) {
    throw new Error('You must specify a build path.');
  }

  buildPath = path.join(root, buildPath);

  const dockerFilePath = path.join(buildPath, 'dockerfile');

  if (!existsSync(buildPath)) {
    throw new Error(`Unable to locate build path for project, '${buildPath}'`);
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

  const versionPath: string = path.join(buildPath, 'VERSION');
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
