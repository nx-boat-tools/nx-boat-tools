import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { existsSync } from 'fs';

import executor from './executor';
import { HelmPackageExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(child_process, 'spawnSync');
const fn = jest.fn((command, args) => {
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

describe('Helm Package Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(fn);
  });

  afterAll(() => {
    mockFs.restore();
  });

  beforeEach(() => {
    fn.mockClear();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when no project specified', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    context.projectName = undefined;

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `No project specified.`
    );
  });

  it('fails when no project helm directory specified', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: undefined,
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify a project helm path.`
    );
  });

  it('fails when no output directory specified', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: undefined,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify an output path.`
    );
  });

  it('fails when project helm folder does not exist', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to locate helm path for project, '${path.join(
        context.root,
        options.projectHelmPath
      )}'`
    );
  });

  it('creates output folder when does not exist', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.projectHelmPath)] = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    const outputDirExists = existsSync(
      path.join(context.root, options.outputPath)
    );

    expect(output.success).toBe(true);
    expect(outputDirExists).toBe(true);
  });

  it('creates the correct Helm CLI command', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.projectHelmPath)] = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('package');
    expect(argsArg[1]).toBe(
      path.join(context.root, options.projectHelmPath, 'chart')
    );
    expect(argsArg[2]).toBe('-d');
    expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
  });

  it('uses passes package.json version to Helm CLI command when present', async () => {
    const options: HelmPackageExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.projectHelmPath)] = {};
    fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
      '{ "version": "1.0.0" }';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('package');
    expect(argsArg[1]).toBe(
      path.join(context.root, options.projectHelmPath, 'chart')
    );
    expect(argsArg[2]).toBe('-d');
    expect(argsArg[3]).toBe(path.join(context.root, options.outputPath));
    expect(argsArg[4]).toBe('--version');
    expect(argsArg[5]).toBe('1.0.0');
  });
});
