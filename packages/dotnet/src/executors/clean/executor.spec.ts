import * as devkit from '@nrwl/devkit';
import {
  TargetSummary,
  createTestExecutorContext,
  promiseToAsyncIterator,
} from '@nx-boat-tools/common';

import executor from './executor';
import { CleanDotnetExecutorSchema } from './schema';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';

const spy = jest.spyOn(devkit, 'runExecutor');
const mockedRunExecutor = jest.fn((summary: TargetSummary) => {
  console.log(
    `running mocked '${summary.target}' executor for project '${summary.project}' and configuration '${summary.configuration}'`
  );

  const asyncIterable = promiseToAsyncIterator(
    Promise.resolve({ success: summary.target !== 'fail' })
  );

  return Promise.resolve(asyncIterable);
});

describe('Build Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(mockedRunExecutor);
  });

  afterAll(() => {
    mockedRunExecutor.mockRestore();
  });

  afterEach(() => {
    mockedRunExecutor.mockClear();
  });

  it('can run', async () => {
    const options: CleanDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
      updateVersion: false,
      runtimeID: 'someRuntime',
      additionalArgs: '--test=true',
      configMap: { dev: 'Develop' },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });
    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(mockedRunExecutor.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedRunExecutor.mock.calls[0];
    const targetArg: TargetSummary = firstCall[0];
    const optionsArg: DotNetCommandExecutorSchema = firstCall[1];
    const contextArg: devkit.ExecutorContext = firstCall[2];

    expect(targetArg.target).toBe('run-dotnet-command');
    expect(optionsArg.action).toBe('clean');
    expect(optionsArg.srcPath).toBe('apps/my-project');
    expect(optionsArg.outputPath).toBe('dist/apps/my-project');
    expect(optionsArg.updateVersion).toBe(false);
    expect(optionsArg.runtimeID).toBe('someRuntime');
    expect(optionsArg.additionalArgs).toBe('--test=true');
    expect(optionsArg.configMap?.dev).toBe('Develop');
    expect(contextArg).toBe(context);
  });
});
