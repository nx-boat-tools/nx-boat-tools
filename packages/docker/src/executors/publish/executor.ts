import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync, readFileSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { PublishExecutorSchema } from './schema';

export default async function runExecutor(
  options: PublishExecutorSchema,
  context: ExecutorContext
) {
  const { buildPath, dockerRepoOrUser } = options;
  const { projectName } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
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

  const versionPath: string = path.join(buildPath, 'VERSION');
  const version = existsSync(versionPath)
    ? readFileSync(versionPath).toString()
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
