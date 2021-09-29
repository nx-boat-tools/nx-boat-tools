import { ExecutorContext } from '@nrwl/devkit';
import { CleanDotnetExecutorSchema } from './schema';
import runDotnetCommand from '../run-dotnet-command/executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';

export default async function runExecutor(
  options: CleanDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'clean',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
