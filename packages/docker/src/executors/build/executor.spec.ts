import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';

import executor from './executor';
import { BuildExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(child_process, 'spawnSync');
const fn = jest.fn((command, args) => {
  return {
    pid: 1,
    output: [
      `Mock spawnSync (Command: '${command}', Args: '${args?.join(' ')}')\n`,
    ],
    stdout: '',
    stderr: '',
    status: 0,
    signal: null,
  };
});

describe('Docker Build Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(fn);
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
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
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

  it('fails when no build path specified', async () => {
    const options: BuildExecutorSchema = {
      buildPath: undefined,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify a build path.`
    );
  });

  it('fails when build path does not exist', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to locate build path for project, '${path.join(
        context.root,
        options.buildPath
      )}'`
    );
  });

  it('fails when dockerfile does not exist', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      'A dockerfile could not be found in the specified build directory.'
    );
  });

  it('creates the correct Docker CLI build command (dockerFilePath undefined)', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {
      dockerfile: '',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('build');
    expect(argsArg[1]).toBe('-t');
    expect(argsArg[2]).toBe(`${context.projectName}:latest`);
    expect(argsArg[3]).toBe('-f');
    expect(argsArg[4]).toBe(
      path.join(context.root, options.buildPath, 'dockerfile')
    );
    expect(argsArg[5]).toBe(path.join(context.root, options.buildPath));
  });

  it('creates the correct Docker CLI build command (dockerFilePath inside projectDir)', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerFilePath: 'apps/my-project/dockerfile.prod',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {
      'dockerfile.prod': '',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('build');
    expect(argsArg[1]).toBe('-t');
    expect(argsArg[2]).toBe(`${context.projectName}:latest`);
    expect(argsArg[3]).toBe('-f');
    expect(argsArg[4]).toBe(path.join(context.root, options.dockerFilePath));
    expect(argsArg[5]).toBe(path.join(context.root, options.buildPath));
  });

  it('creates the correct Docker CLI build command (dockerFilePath outside projectDir)', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerFilePath: 'images/base-dockerfile',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {};
    fakeFs[path.join(context.root, 'images', 'base-dockerfile')] = '';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('build');
    expect(argsArg[1]).toBe('-t');
    expect(argsArg[2]).toBe(`${context.projectName}:latest`);
    expect(argsArg[3]).toBe('-f');
    expect(argsArg[4]).toBe(path.join(context.root, options.dockerFilePath));
    expect(argsArg[5]).toBe(path.join(context.root, options.buildPath));
  });

  it('creates an additional Docker CLI tag command with version when present in package.json', async () => {
    const options: BuildExecutorSchema = {
      buildPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {
      dockerfile: '',
      'package.json': '{ "version": "1.0.0" }',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(2);

    let mockCall = fn.mock.calls[0];
    let commandArg: string = mockCall[0];
    let argsArg: string[] = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('build');
    expect(argsArg[1]).toBe('-t');
    expect(argsArg[2]).toBe(`${context.projectName}:latest`);
    expect(argsArg[3]).toBe('-f');
    expect(argsArg[4]).toBe(
      path.join(context.root, options.buildPath, 'dockerfile')
    );
    expect(argsArg[5]).toBe(path.join(context.root, options.buildPath));

    mockCall = fn.mock.calls[1];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('tag');
    expect(argsArg[1]).toBe(`${context.projectName}:latest`);
    expect(argsArg[2]).toBe(`${context.projectName}:1.0.0`);
  });
});
