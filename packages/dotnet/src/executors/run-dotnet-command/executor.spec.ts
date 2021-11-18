import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import each from 'jest-each';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { readFileSync } from 'fs';

import executor from './executor';
import { DotNetCommandExecutorSchema } from './schema';
import { createTestCsprojContent } from '../../utilities/csprojFileHelper';
import { createTestSlnContent } from '../../utilities/slnFileHelper';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(child_process, 'spawnSync');
const fn = jest.fn((command, args, options) => {
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

describe('Run Dotnet Command Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(fn);
  });

  afterAll(() => {
    fn.mockRestore();
    mockFs.restore();
  });

  beforeEach(() => {
    fn.mockClear();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it("fails when project is 'undefined'", async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'clean',
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

    context.projectName = undefined;

    expect(defuse(executor(options, context))).rejects.toThrow(
      'You must specify a project!'
    );
  });

  each([[undefined], ['']]).it(
    "fails when srcPath is '%s'",
    async (srcPath) => {
      const options: DotNetCommandExecutorSchema = {
        action: 'clean',
        srcPath: srcPath,
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

      expect(defuse(executor(options, context))).rejects.toThrow(
        'You must specify the location of the csproj file for the project.'
      );
    }
  );

  each([[undefined], ['']]).it(
    "fails when outputPath is '%s'",
    async (outputPath) => {
      const options: DotNetCommandExecutorSchema = {
        action: 'clean',
        srcPath: 'apps/my-project',
        outputPath: outputPath,
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

      expect(defuse(executor(options, context))).rejects.toThrow(
        'You must specify an output path.'
      );
    }
  );

  each([
    ['build', 'You must specify an output path.'],
    ['pack', 'You must specify an output path.'],
    ['publish', 'You must specify an output path.'],
    ['run', 'You must specify an output path.'],
    ['clean', 'You must specify an output path.'],
    ['new', 'You must specify a valid action.'],
    ['task', 'You must specify a valid action.'],
    ['123', 'You must specify a valid action.'],
  ]).it(
    "fails when action isn't supported. (%s)",
    async (action, expectedError) => {
      const options: DotNetCommandExecutorSchema = {
        action: action,
        srcPath: 'apps/my-project',
        outputPath: undefined, //outputPath is undefined so valid actions don't execute
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

      expect(defuse(executor(options, context))).rejects.toThrow(expectedError);
    }
  );

  it('fails when srcPath does not exist', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'clean',
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

    const fakeFs = {};
    fakeFs[path.join(context.root, 'apps')] = {
      /** empty directory */
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to locate src path, '${path.join(context.root, options.srcPath)}'`
    );
  });

  each([
    ['apps/my-project', { 'test.sln': '' }],
    [
      'apps/my-project/test',
      {
        /** empty directory */
      },
    ],
    ['apps/my-project/test', ''],
    ['apps/my-project/test.temp', ''],
    ['apps/my-project/test.csproj.old', ''],
  ]).it(
    'fails when srcPath not csproj or sln (%s)',
    async (srcPath, srcPathContents) => {
      const options: DotNetCommandExecutorSchema = {
        action: 'build', //action must be build to check csproj updates
        srcPath: srcPath,
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

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] = srcPathContents;

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      expect(defuse(executor(options, context))).rejects.toThrow(
        "The dotnet project file must have an extenstion of '.csproj' or '.sln'"
      );
    }
  );

  it('fails when updateVersion true but no VERSION exists (csproj)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.csproj',
      outputPath: 'dist/apps/my-project',
      updateVersion: true,
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to detect version. No VERSION file found at '${path.join(
        context.root,
        options.outputPath,
        'VERSION'
      )}'!`
    );
  });

  it('updates csproj versions when updateVersion true and VERSION exists (csproj)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.csproj',
      outputPath: 'dist/apps/my-project',
      updateVersion: true,
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();
    fakeFs[path.join(context.root, options.outputPath, 'VERSION')] = '0.0.1';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    const csproj = readFileSync(
      path.join(context.root, options.srcPath)
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')
    ).toBeGreaterThan(0);
  });

  it('updates csproj IsPackable when updateVersion false (csproj)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.csproj',
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();
    fakeFs[path.join(context.root, options.outputPath, 'VERSION')] = '0.0.1';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    const csproj = readFileSync(
      path.join(context.root, options.srcPath)
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')).toBe(-1);
    expect(csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')).toBe(-1);
  });

  it('fails when updateVersion true but no VERSION exists (sln)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.sln',
      outputPath: 'dist/apps/my-project',
      updateVersion: true,
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to detect version. No VERSION file found at '${path.join(
        context.root,
        options.outputPath,
        'VERSION'
      )}'!`
    );
  });

  it('updates csproj versions when updateVersion true and VERSION exists (sln)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.sln',
      outputPath: 'dist/apps/my-project',
      updateVersion: true,
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.outputPath, 'VERSION')] = '0.0.1';
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    let csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')
    ).toBeGreaterThan(0);

    csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')
    ).toBeGreaterThan(0);
  });

  it('updates csproj IsPackable when updateVersion false (sln)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'build', //action must be build to check csproj updates
      srcPath: 'apps/my-project/test.sln',
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.outputPath, 'VERSION')] = '0.0.1';
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    let csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')).toBe(-1);
    expect(csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')).toBe(-1);

    csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ).toString();
    expect(csproj.indexOf('<IsPackable>true</IsPackable>')).toBeGreaterThan(0);
    expect(csproj.indexOf('<ReleaseVersion>0.0.1</ReleaseVersion>')).toBe(-1);
    expect(csproj.indexOf('<PackageVersion>0.0.1</PackageVersion>')).toBe(-1);
  });

  each([['pack'], ['publish'], ['run'], ['clean']]).it(
    'fails when srcPath not csproj or sln (%s)',
    async (action) => {
      const options: DotNetCommandExecutorSchema = {
        action: action,
        srcPath: 'apps/my-project.tmp', //if action=build then .tmp would fail in the update csproj
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

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] = '';

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      await executor(options, context);

      expect(fn.mock.calls.length).toBe(1);
    }
  );

  it('formats correctly for action (run)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'run',
      srcPath: 'apps/my-project.csproj',
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

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('dotnet');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--project');
    expect(argsArg[2]).toBe(path.join(context.root, options.srcPath));
    expect(argsArg[3]).toBe('--configuration');
    expect(argsArg[4]).toBe('prod');
    expect(argsArg[5]).toBe('--runtime');
    expect(argsArg[6]).toBe('someRuntime');
    expect(argsArg[7]).toBe('--test=true');
  });

  each([['build'], ['pack'], ['publish'], ['clean']]).it(
    'formats correctly for action (%s)',
    async (action) => {
      const options: DotNetCommandExecutorSchema = {
        action: action,
        srcPath: 'apps/my-project.csproj',
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

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] =
        createTestCsprojContent();

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      await executor(options, context);

      expect(fn.mock.calls.length).toBe(1);

      const firstCall = fn.mock.calls[0];
      const commandArg: string = firstCall[0];
      const argsArg: string[] = firstCall[1];

      expect(commandArg).toBe('dotnet');
      expect(argsArg[0]).toBe(action);
      expect(argsArg[1]).toBe(path.join(context.root, options.srcPath));
      expect(argsArg[2]).toBe('--output');
      expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
      expect(argsArg[4]).toBe('--configuration');
      expect(argsArg[5]).toBe('prod');
      expect(argsArg[6]).toBe('--runtime');
      expect(argsArg[7]).toBe('someRuntime');
      expect(argsArg[8]).toBe('--test=true');
    }
  );

  each([
    ['dev', 'Develop'],
    ['DEV', 'DEV'],
    ['prod', 'Release'],
    ['production', 'production'],
    ['random', 'random'],
  ]).it(
    'maps configuration to configMap correctly (%s)',
    async (configurationName, expected) => {
      const options: DotNetCommandExecutorSchema = {
        action: 'run',
        srcPath: 'apps/my-project.csproj',
        outputPath: 'dist/apps/my-project',
        updateVersion: false,
        runtimeID: 'someRuntime',
        additionalArgs: '--test=true',
        configMap: { dev: 'Develop', prod: 'Release' },
      };
      const context = createTestExecutorContext({
        configurationName: configurationName,
        targetsMap: [
          { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
        ],
      });

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] =
        createTestCsprojContent();

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      await executor(options, context);

      expect(fn.mock.calls.length).toBe(1);

      const firstCall = fn.mock.calls[0];
      const commandArg: string = firstCall[0];
      const argsArg: string[] = firstCall[1];

      expect(commandArg).toBe('dotnet');
      expect(argsArg[0]).toBe('run');
      expect(argsArg[1]).toBe('--project');
      expect(argsArg[2]).toBe(path.join(context.root, options.srcPath));
      expect(argsArg[3]).toBe('--configuration');
      expect(argsArg[4]).toBe(expected);
      expect(argsArg[5]).toBe('--runtime');
      expect(argsArg[6]).toBe('someRuntime');
      expect(argsArg[7]).toBe('--test=true');
    }
  );

  it('formats correctly for no optional params (run)', async () => {
    const options: DotNetCommandExecutorSchema = {
      action: 'run',
      srcPath: 'apps/my-project.csproj',
      outputPath: 'dist/apps/my-project',
      updateVersion: false,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [
        { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
      ],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    await executor(options, context);

    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('dotnet');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--project');
    expect(argsArg[2]).toBe(path.join(context.root, options.srcPath));
  });

  each([['build'], ['pack'], ['publish'], ['clean']]).it(
    'formats correctly for no optional params (%s)',
    async (action) => {
      const options: DotNetCommandExecutorSchema = {
        action: action,
        srcPath: 'apps/my-project.csproj',
        outputPath: 'dist/apps/my-project',
        updateVersion: false,
      };
      const context = createTestExecutorContext({
        configurationName: 'prod',
        targetsMap: [
          { name: 'run-dotnet-command', echo: 'hello from run-dotnet-command' },
        ],
      });

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] =
        createTestCsprojContent();

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      await executor(options, context);

      expect(fn.mock.calls.length).toBe(1);

      const firstCall = fn.mock.calls[0];
      const commandArg: string = firstCall[0];
      const argsArg: string[] = firstCall[1];

      expect(commandArg).toBe('dotnet');
      expect(argsArg[0]).toBe(action);
      expect(argsArg[1]).toBe(path.join(context.root, options.srcPath));
      expect(argsArg[2]).toBe('--output');
      expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
    }
  );
});
