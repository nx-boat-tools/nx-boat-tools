import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { getVersionForProject, spawnAsync } from '@nx-boat-tools/common';

import { PublishExecutorSchema } from './schema';

export default async function runExecutor(
  options: PublishExecutorSchema,
  context: ExecutorContext
) {
  const { buildPath } = options;
  const { dockerRepoOrUser } = options;
  const { projectName, root } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (dockerRepoOrUser === undefined || dockerRepoOrUser === '') {
    throw new Error('You must specify either a docker repo or user.');
  }

  console.log(
    `\n📤  Publishing docker image '${projectName}:latest' to repository '${dockerRepoOrUser}'...\n`
  );
  console.log(
    await spawnAsync(
      `docker tag ${projectName}:latest ${dockerRepoOrUser}/${projectName}:latest`
    )
  );
  console.log(
    await spawnAsync(`docker push ${dockerRepoOrUser}/${projectName}:latest`)
  );

  const version: string | undefined =
    buildPath !== undefined && buildPath !== ''
      ? getVersionForProject(path.join(root, buildPath), false)
      : undefined;

  if (version !== undefined) {
    console.log(
      `\n📤  Publishing docker image '${projectName}:${version}' to repository '${dockerRepoOrUser}'...\n`
    );
    console.log(
      await spawnAsync(
        `docker tag ${projectName}:${version} ${dockerRepoOrUser}/${projectName}:${version}`
      )
    );
    console.log(
      await spawnAsync(
        `docker push ${dockerRepoOrUser}/${projectName}:${version}`
      )
    );
  }

  console.log(`🎉 Docker publish complete!`);

  return { success: true };
}
