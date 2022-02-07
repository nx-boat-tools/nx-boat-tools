import { ExecutorContext } from '@nrwl/devkit';

import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { RunDotnetExecutorSchema } from './schema';
import { runDotnetCommand } from '../run-dotnet-command/executor';

export default async function run(
  options: RunDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'run',
  };

  return await runDotnetCommand(dotnetOptions, context);
}
