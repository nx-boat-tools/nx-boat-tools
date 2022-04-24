import { Console } from 'console';
import { ExecutorContext } from '@nrwl/devkit';
import { createTestExecutorContext } from '@nx-boat-tools/common';

import * as runDotnetCommandExecutor from '../run-dotnet-command/executor';
import executor from './executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { RunDotnetExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(runDotnetCommandExecutor, 'runDotnetCommand');
const mockedRunExecutor = jest.fn(async () => {
  return { success: true };
});

describe('Dotnet Run Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(mockedRunExecutor);
  });

  afterAll(() => {
    mockedRunExecutor.mockRestore();
  });

  beforeEach(() => {
    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockedRunExecutor.mockClear();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('successfully calls run-dotnet-command', async () => {
    const options: RunDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
      runtimeID: 'someRuntime',
      additionalArgs: '--test=true',
      configuration: 'Develop',
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

    const firstCall: any[] = mockedRunExecutor.mock.calls[0]; //eslint-disable-line
    const optionsArg: DotNetCommandExecutorSchema = firstCall[0];
    const contextArg: ExecutorContext = firstCall[1];

    expect(optionsArg.action).toBe('run');
    expect(optionsArg.srcPath).toBe('apps/my-project');
    expect(optionsArg.outputPath).toBe('dist/apps/my-project');
    expect(optionsArg.runtimeID).toBe('someRuntime');
    expect(optionsArg.additionalArgs).toBe('--test=true');
    expect(optionsArg.configuration).toBe('Develop');
    expect(contextArg).toBe(context);
  });
});
