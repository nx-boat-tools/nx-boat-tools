import { ExecutorContext } from '@nrwl/devkit';

import { BuildDotnetExecutorSchema } from './schema';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { runDotnetCommand } from '../run-dotnet-command/executor';

export default async function run(
  options: BuildDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'build',
  };

  return await runDotnetCommand(dotnetOptions, context);
}
