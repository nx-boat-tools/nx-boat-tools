import { SetVersionExecutorSchema } from './schema';
import executor from './executor';
import { ExecutorContext } from '@nrwl/devkit';

const options: SetVersionExecutorSchema = {
  projectPath: 'apps/my-project',
  outputPath: 'dist/my-project'
};

const context: ExecutorContext = {
  root: __dirname,
  projectName: "my-project",
  targetName: undefined,
  configurationName: undefined,
  target: undefined,
  workspace: undefined,
  cwd: __dirname,
  isVerbose: false,
}

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});