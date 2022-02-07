import { ExecutorContext } from '@nrwl/devkit';

import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { PublishDotnetExecutorSchema } from './schema';
import { runDotnetCommand } from '../run-dotnet-command/executor';

export default async function run(
  options: PublishDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'publish',
  };

  return await runDotnetCommand(dotnetOptions, context);
}
