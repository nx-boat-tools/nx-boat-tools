import * as devkit from '@nrwl/devkit';
import { Console } from 'console';

import executor from './executor';
import { ChainExecutorSchema } from './schema';
import {
  TargetSummary,
  createFakeExecutor,
  createTestExecutorContext,
} from '../../utilities/executorTestHelpers';

import * as _ from 'underscore';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(devkit, 'runExecutor');
const mockedRunExecutor = jest.fn(createFakeExecutor());

describe('Chain Executor', () => {
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

  it('executes all expected targets in order', async () => {
    const options: ChainExecutorSchema = {
      targets: ['build', 'test'],
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'test', echo: 'hello from test' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = ['build', 'test'];

    expect(output.success).toBe(true);
    expect(mockedRunExecutor.mock.calls.length).toBe(expectedTargets.length);

    _.each(mockedRunExecutor.mock.calls, (call: any, i: number) => {
      const targetArg: TargetSummary = call[0];
      const contextArg: devkit.ExecutorContext = call[2];

      expect(targetArg.project).toBe('my-project');
      expect(targetArg.target).toBe(expectedTargets[i]);
      expect(targetArg.configuration).toBe(undefined);

      expect(contextArg).toBe(context);
    });
  });

  it('executes additional targets last', async () => {
    const options: ChainExecutorSchema = {
      targets: ['build', 'test'],
      additionalTargets: ['additional'],
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'test', echo: 'hello from test' },
        { name: 'additional', echo: 'hello from additional' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = ['build', 'test', 'additional'];

    expect(output.success).toBe(true);
    expect(mockedRunExecutor.mock.calls.length).toBe(expectedTargets.length);

    _.each(mockedRunExecutor.mock.calls, (call: any, i: number) => {
      const targetArg: TargetSummary = call[0];
      const contextArg: devkit.ExecutorContext = call[2];

      expect(targetArg.project).toBe('my-project');
      expect(targetArg.target).toBe(expectedTargets[i]);
      expect(targetArg.configuration).toBe(undefined);

      expect(contextArg).toBe(context);
    });
  });

  it('executes targets with configuration', async () => {
    const options: ChainExecutorSchema = {
      targets: ['build', 'test'],
      additionalTargets: ['additional'],
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'test', echo: 'hello from test' },
        { name: 'additional', echo: 'hello from additional' },
      ],
    });

    const output = await executor(options, context);

    const expectedTargets = ['build', 'test', 'additional'];

    expect(output.success).toBe(true);
    expect(mockedRunExecutor.mock.calls.length).toBe(expectedTargets.length);

    _.each(mockedRunExecutor.mock.calls, (call: any, i: number) => {
      const targetArg: TargetSummary = call[0];
      const contextArg: devkit.ExecutorContext = call[2];

      expect(targetArg.project).toBe('my-project');
      expect(targetArg.target).toBe(expectedTargets[i]);
      expect(targetArg.configuration).toBe('prod');

      expect(contextArg).toBe(context);
    });
  });
});
