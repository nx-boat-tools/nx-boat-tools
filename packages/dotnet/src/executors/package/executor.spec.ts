import * as devkit from '@nrwl/devkit';
import {
  TargetSummary,
  createFakeExecutor,
  createTestExecutorContext,
} from '@nx-boat-tools/common';
import { Console } from 'console';

import executor from './executor';
import { DotNetCommandExecutorSchema } from '../run-dotnet-command/schema';
import { PackageDotnetExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(devkit, 'runExecutor');
const mockedRunExecutor = jest.fn(createFakeExecutor());

describe('Dotnet Package Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(mockedRunExecutor);
  });

  afterAll(() => {
    mockedRunExecutor.mockRestore();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockedRunExecutor.mockClear();
    
    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('successfully calls run-dotnet-command', async () => {
    const options: PackageDotnetExecutorSchema = {
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
    expect(optionsArg.action).toBe('pack');
    expect(optionsArg.srcPath).toBe('apps/my-project');
    expect(optionsArg.outputPath).toBe('dist/apps/my-project');
    expect(optionsArg.updateVersion).toBe(false);
    expect(optionsArg.runtimeID).toBe('someRuntime');
    expect(optionsArg.additionalArgs).toBe('--test=true');
    expect(optionsArg.configMap?.dev).toBe('Develop');
    expect(contextArg).toBe(context);
  });
});
