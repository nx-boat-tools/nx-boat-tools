import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import each from 'jest-each';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { sync as globSync } from 'glob';

import executor from './executor';
import { TestDotnetExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(child_process, 'spawnSync');
const mockedSpawn = jest.fn((command, args) => {
  return {
    pid: 1,
    output: [
      `Mock spawnSync (Command: '${command}', Args: '${args.join(' ')}')\n`,
    ],
    stdout: '',
    stderr: '',
    status: 0,
    signal: null,
  };
});

describe('Dotnet Test Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(mockedSpawn);
  });

  afterAll(() => {
    mockedSpawn.mockRestore();
  });

  beforeEach(() => {
    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockedSpawn.mockClear();
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it("fails when project is 'undefined'", async () => {
    const options: TestDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
      coveragePath: 'coverage/apps/my-project',
      configuration: 'Develop',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });

    context.projectName = undefined;

    expect(defuse(executor(options, context))).rejects.toThrow(
      'You must specify a project!'
    );
  });

  each([[undefined], ['']]).it(
    "fails when srcPath is '%s'",
    async (srcPath) => {
      const options: TestDotnetExecutorSchema = {
        srcPath: srcPath,
        outputPath: 'dist/apps/my-project',
        coveragePath: 'coverage/apps/my-project',
        configuration: 'Develop',
      };
      const context = createTestExecutorContext({
        configurationName: 'prod',
        targetsMap: [
          { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
        ],
      });

      expect(defuse(executor(options, context))).rejects.toThrow(
        'You must specify the location of the csproj file for the project.'
      );
    }
  );

  each([[undefined], ['']]).it(
    "fails when outputPath is '%s'",
    async (outputPath) => {
      const options: TestDotnetExecutorSchema = {
        srcPath: 'apps/my-project',
        outputPath: outputPath,
        coveragePath: 'coverage/apps/my-project',
        configuration: 'Develop',
      };
      const context = createTestExecutorContext({
        configurationName: 'prod',
        targetsMap: [
          { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
        ],
      });

      expect(defuse(executor(options, context))).rejects.toThrow(
        'You must specify an output path.'
      );
    }
  );

  it('formats correct command (all params)', async () => {
    const options: TestDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
      coveragePath: 'coverage/apps/my-project',
      runtimeID: 'someRuntime',
      additionalArgs: '--test=true',
      configuration: 'Test',
      collector: 'some collector',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] = '';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(mockedSpawn.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedSpawn.mock.calls[0]; //eslint-disable-line
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('dotnet');
    expect(argsArg[0]).toBe('test');
    expect(argsArg[1]).toBe(path.join(context.root, options.srcPath));
    expect(argsArg[2]).toBe('--output');
    expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
    expect(argsArg[4]).toBe('--results-directory');
    expect(argsArg[5]).toBe(path.join(context.root, options.coveragePath));
    expect(argsArg[6]).toBe('--collect');
    expect(argsArg[7]).toBe('"some collector"');
    expect(argsArg[8]).toBe('--configuration');
    expect(argsArg[9]).toBe('Test');
    expect(argsArg[10]).toBe('--runtime');
    expect(argsArg[11]).toBe('someRuntime');
    expect(argsArg[12]).toBe('--test=true');
  });

  it('formats correct command (only required params)', async () => {
    const options: TestDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] = '';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(mockedSpawn.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedSpawn.mock.calls[0]; //eslint-disable-line
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('dotnet');
    expect(argsArg[0]).toBe('test');
    expect(argsArg[1]).toBe(path.join(context.root, options.srcPath));
    expect(argsArg[2]).toBe('--output');
    expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
    expect(argsArg[4]).toBe('--results-directory');
    expect(argsArg[5]).toBe(path.join(context.root, 'coverage/apps/my-project'));
    expect(argsArg[6]).toBe('--collect');
    expect(argsArg[7]).toBe('"XPlat Code Coverage"');
  });

  it('flattens coverage directory results', async () => {
    const options: TestDotnetExecutorSchema = {
      srcPath: 'apps/my-project',
      outputPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });

    const expectedCoveragePath = path.join(context.root, 'coverage', options.srcPath);
    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] = '';
    fakeFs[expectedCoveragePath] = {
      nestedDir: {
        'results.xml': 'sample results'
      }
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    const files = globSync(path.join(expectedCoveragePath, '**', '*'), { nodir: true });

    expect(files).toContain(path.join(expectedCoveragePath, 'results.xml'));
  });
});
