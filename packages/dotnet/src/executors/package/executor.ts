import { ExecutorContext } from '@nrwl/devkit';

import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { PackageDotnetExecutorSchema } from './schema';
import { runDotnetCommand } from '../run-dotnet-command/executor';

export default async function run(
  options: PackageDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'pack',
  };

  return await runDotnetCommand(dotnetOptions, context);
}
