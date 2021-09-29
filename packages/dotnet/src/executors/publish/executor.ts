import { ExecutorContext } from '@nrwl/devkit';
import { PublishDotnetExecutorSchema } from './schema';
import runDotnetCommand from '../run-dotnet-command/executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';

export default async function runExecutor(
  options: PublishDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'publish',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
