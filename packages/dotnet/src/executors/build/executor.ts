import { ExecutorContext } from '@nrwl/devkit';
import { BuildDotnetExecutorSchema } from './schema';
import runDotnetCommand from '../run-dotnet-command/executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';

export default async function runExecutor(
  options: BuildDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'build',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
