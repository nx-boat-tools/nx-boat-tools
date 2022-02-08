import * as _ from 'underscore';
import { ExecutorContext } from '@nrwl/devkit';
import { execSync } from 'child_process';

import { BuildExecutorSchema } from '../build/schema';
import { MinikubeBuildExecutorSchema } from './schema';
import { dockerBuildExecutor } from '../build/executor';

export default async function runExecutor(
  options: MinikubeBuildExecutorSchema,
  context: ExecutorContext
) {
  const dockerOptions = {
    buildPath: options.buildPath,
    dockerFilePath: options.dockerFilePath,
  } as BuildExecutorSchema;

  const dockerEnvVars = execSync('minikube docker-env')
    .toString('utf-8')
    .replace(/(export|set|set -gx|\$Env:|SET|\(setenv ")/g, '')
    .replace(/[ ";]/g, '')
    .split('\n')
    .filter((line) => !line.startsWith('#') && line !== '');

  const dockerEnvPairs = _.map(dockerEnvVars, (v) => v.split('='));

  _.each(dockerEnvPairs, (pair) => {
    process.env[pair[0]] = pair[1];
  });

  const args = {
    env: {
      ...process.env,
      ..._.object(dockerEnvPairs),
    },
  };

  return await dockerBuildExecutor(dockerOptions, context, args);
}
