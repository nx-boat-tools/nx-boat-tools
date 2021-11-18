import * as _ from 'underscore';
import { ExecutorContext, runExecutor } from '@nrwl/devkit';
import { asyncIteratorToArray } from '@nx-boat-tools/common';

import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { PackageDotnetExecutorSchema } from './schema';

export default async function run(
  options: PackageDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'pack',
  };

  const asyncResults = await runExecutor(
    {
      project: context.projectName,
      target: 'run-dotnet-command',
      configuration: context.configurationName,
    },
    dotnetOptions,
    context
  );

  const results = await asyncIteratorToArray(asyncResults);

  const success = _.all(results, (r) => r.success === true);

  if (!success) throw new Error('Executor failed');

  return { success: true };
}
