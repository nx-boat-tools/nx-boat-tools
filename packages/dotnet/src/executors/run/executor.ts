import { ExecutorContext } from '@nrwl/devkit';
import { RunDotnetExecutorSchema } from './schema';
import runDotnetCommand from '../run-dotnet-command/executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';

export default async function runExecutor(
  options: RunDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'run',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
