import { ExecutorContext } from '@nrwl/devkit';

import runDotnetCommand from '../run-dotnet-command/executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { PackageDotnetExecutorSchema } from './schema';

export default async function runExecutor(
  options: PackageDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'pack',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
