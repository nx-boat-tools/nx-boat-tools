import { ExecutorContext } from '@nrwl/devkit';

import { CleanDotnetExecutorSchema } from './schema';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { runDotnetCommand } from '../run-dotnet-command/executor';

export default async function run(
  options: CleanDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'clean',
  };

  return await runDotnetCommand(dotnetOptions, context);
}
