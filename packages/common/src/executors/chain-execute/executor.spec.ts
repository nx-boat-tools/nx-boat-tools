import * as _ from 'underscore';
import * as devkit from '@nrwl/devkit';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';

import executor from './executor';
import { ChainExecutorSchema } from './schema';
import {
  TargetSummary,
  createFakeExecutor,
  createTestExecutorContext,
} from '../../utilities/executorTestHelpers';
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
    mockFs.restore();

    mockedRunExecutor.mockClear();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('executes all expected targets in order (without stages)', async () => {
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

  it('executes all expected targets in order (with implicit stages - no filter)', async () => {
    const options: ChainExecutorSchema = {
      targets: ['pre'],
      postTargets: ['post'],
      stages: {
        src: {
          targets: ['build'],
          postTargets: ['test'],
        },
        package: {
          targets: ['package'],
          postTargets: ['publish'],
        },
      },
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'package', echo: 'hello from package' },
        { name: 'pre', echo: 'hello from pre' },
        { name: 'post', echo: 'hello from post' },
        { name: 'publish', echo: 'hello from publish' },
        { name: 'test', echo: 'hello from test' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = [
      'pre',
      'build',
      'package',
      'post',
      'test',
      'publish',
    ];

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

  it('executes all expected targets in order (with implicit stages - filtered)', async () => {
    const options: ChainExecutorSchema = {
      run: ['src'],
      targets: ['pre'],
      postTargets: ['post'],
      stages: {
        src: {
          targets: ['build'],
          postTargets: ['test'],
        },
        package: {
          targets: ['package'],
          postTargets: ['publish'],
        },
      },
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'package', echo: 'hello from package' },
        { name: 'pre', echo: 'hello from pre' },
        { name: 'post', echo: 'hello from post' },
        { name: 'publish', echo: 'hello from publish' },
        { name: 'test', echo: 'hello from test' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = ['pre', 'build', 'post', 'test'];

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

  it('executes all expected targets in order (with explicit stage - no filter)', async () => {
    const options: ChainExecutorSchema = {
      targets: ['pre'],
      postTargets: ['post'],
      stages: {
        src: {
          targets: ['build'],
          postTargets: ['test'],
        },
        package: {
          explicit: true,
          targets: ['package'],
          postTargets: ['publish'],
        },
      },
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'package', echo: 'hello from package' },
        { name: 'pre', echo: 'hello from pre' },
        { name: 'post', echo: 'hello from post' },
        { name: 'publish', echo: 'hello from publish' },
        { name: 'test', echo: 'hello from test' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = ['pre', 'build', 'post', 'test'];

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

  it('executes all expected targets in order (with explicit stage - filtered)', async () => {
    const options: ChainExecutorSchema = {
      run: ['src', 'package'],
      targets: ['pre'],
      postTargets: ['post'],
      stages: {
        src: {
          targets: ['build'],
          postTargets: ['test'],
        },
        package: {
          explicit: true,
          targets: ['package'],
          postTargets: ['publish'],
        },
      },
    };
    const context = createTestExecutorContext({
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        { name: 'package', echo: 'hello from package' },
        { name: 'pre', echo: 'hello from pre' },
        { name: 'post', echo: 'hello from post' },
        { name: 'publish', echo: 'hello from publish' },
        { name: 'test', echo: 'hello from test' },
      ],
    });
    const output = await executor(options, context);

    const expectedTargets = [
      'pre',
      'build',
      'package',
      'post',
      'test',
      'publish',
    ];

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
      targets: ['pre'],
      postTargets: ['post'],
      stages: {
        src: {
          targets: ['build'],
          postTargets: ['test'],
        },
        package: {
          targets: ['package'],
          postTargets: ['publish'],
        },
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'build', echo: 'hello from build' },
        {
          name: 'package',
          echo: 'hello from package',
          configurations: { prod: { echo: 'hello from package prod' } },
        },
        { name: 'pre', echo: 'hello from pre' },
        { name: 'post', echo: 'hello from post' },
        {
          name: 'publish',
          echo: 'hello from publish',
          configurations: { prod: { echo: 'hello from publish prod' } },
        },
        {
          name: 'test',
          echo: 'hello from test',
          configurations: { prod: { echo: 'hello from test prod' } },
        },
      ],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, 'workspace.json')] = `{
      "version": 2,
      "projects": {
        "${context.projectName}": ${JSON.stringify(
      context.workspace.projects[context.projectName]
    )}}
    }`;

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    const expectedTargets = [
      'pre',
      'build',
      'package',
      'post',
      'test',
      'publish',
    ];

    const expectedConfigurations = [
      undefined,
      undefined,
      'prod',
      undefined,
      'prod',
      'prod',
    ];

    expect(output.success).toBe(true);
    expect(mockedRunExecutor.mock.calls.length).toBe(expectedTargets.length);

    _.each(mockedRunExecutor.mock.calls, (call: any, i: number) => {
      const targetArg: TargetSummary = call[0];
      const contextArg: devkit.ExecutorContext = call[2];

      expect(targetArg.project).toBe('my-project');
      expect(targetArg.target).toBe(expectedTargets[i]);
      expect(targetArg.configuration).toBe(expectedConfigurations[i]);

      expect(contextArg).toBe(context);
    });
  });
});
