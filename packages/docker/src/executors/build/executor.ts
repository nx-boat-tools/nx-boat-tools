import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { SpawnSyncOptions } from 'child_process';
import { existsSync } from 'fs';
import { getVersionForProject, spawnAsync } from '@nx-boat-tools/common';

import { BuildExecutorSchema } from './schema';

export async function dockerBuildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext,
  spawnArgs?: SpawnSyncOptions
) {
  let { buildPath, dockerFilePath } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (buildPath === undefined) {
    throw new Error('You must specify a build path.');
  }

  buildPath = path.join(root, buildPath);

  dockerFilePath =
    dockerFilePath == undefined
      ? path.join(buildPath, 'dockerfile')
      : path.join(root, dockerFilePath);

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
      `docker build -t ${projectName}:latest -f ${dockerFilePath} ${buildPath}`,
      [],
      spawnArgs
    )
  );

  const projectPath: string = path.join(
    root,
    context.workspace.projects[projectName].root
  );
  const version = getVersionForProject(projectPath, false);

  if (version !== undefined) {
    console.log(
      `\n🏷 Tagging image with version '${projectName}:${version}'...\n`
    );
    console.log(
      await spawnAsync(
        `docker tag ${projectName}:latest ${projectName}:${version}`,
        [],
        spawnArgs
      )
    );
  }

  console.log(`🎉 Docker build complete!`);

  return { success: true };
}

export default dockerBuildExecutor;
