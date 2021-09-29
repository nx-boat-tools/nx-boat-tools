import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { spawnAsync } from '@nx-boat-tools/common';

import { DockerRunExecutorSchema } from './schema';

export default async function runExecutor(
  options: DockerRunExecutorSchema,
  context: ExecutorContext
) {
  let { vars, ports, mounts } = options;
  const { projectName } = context;

  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  vars = vars !== undefined ? vars : {};
  ports = ports !== undefined ? ports : {};

  if (mounts !== undefined) {
    mounts = _.invert(mounts);
    mounts = _.mapObject(mounts, (m: string) => path.join(context.root, m));
    mounts = _.invert(mounts);
  }

  const createDockerArgs = (
    obj: { [keyName: string]: string },
    argName: string,
    delimeter: string
  ) => {
    return _.map(
      _.keys(obj),
      (key: string) =>
        `-${argName} ${key.replace(' ', '')}${delimeter}${obj[key]
          .toString()
          .replace(' ', '')}`
    ).join(' ');
  };

  const varsString = createDockerArgs(vars, 'e', '=');
  const portsString = createDockerArgs(ports, 'p', ':');
  const mountsString = createDockerArgs(mounts, 'v', ':');

  const args = _.without(['--rm', varsString, portsString, mountsString], '');

  console.log(`\n👟 Running docker image '${projectName}'...\n`);
  console.log(await spawnAsync(`docker run ${args.join(' ')} ${projectName}`));

  return { success: true };
}
