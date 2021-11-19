import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';

import executor from './executor';
import { PublishExecutorSchema } from './schema';

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

describe('Docker Publish Executor', () => {
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
    const options: PublishExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerRepoOrUser: 'my-user',
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

  it('fails when no docker repo or user specified', async () => {
    const options: PublishExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerRepoOrUser: undefined,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify either a docker repo or user.`
    );
  });

  it('creates the correct Docker CLI tag and push commands (no build path)', async () => {
    const options: PublishExecutorSchema = {
      buildPath: undefined,
      dockerRepoOrUser: 'my-user',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, 'apps/my-project')] = {
      dockerfile: '',
      VERSION: '1.0.0',
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
    expect(argsArg[0]).toBe('tag');
    expect(argsArg[1]).toBe(`${context.projectName}:latest`);
    expect(argsArg[2]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );

    mockCall = fn.mock.calls[1];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('push');
    expect(argsArg[1]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );
  });

  it('creates the correct Docker CLI tag and push commands (build path)', async () => {
    const options: PublishExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerRepoOrUser: 'my-user',
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
    expect(fn.mock.calls.length).toBe(2);

    let mockCall = fn.mock.calls[0];
    let commandArg: string = mockCall[0];
    let argsArg: string[] = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('tag');
    expect(argsArg[1]).toBe(`${context.projectName}:latest`);
    expect(argsArg[2]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );

    mockCall = fn.mock.calls[1];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('push');
    expect(argsArg[1]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );
  });

  it('creates an additional Docker CLI tag command with VERSION when present', async () => {
    const options: PublishExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerRepoOrUser: 'my-user',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {
      dockerfile: '',
      VERSION: '1.0.0',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(4);

    let mockCall = fn.mock.calls[0];
    let commandArg: string = mockCall[0];
    let argsArg: string[] = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('tag');
    expect(argsArg[1]).toBe(`${context.projectName}:latest`);
    expect(argsArg[2]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );

    mockCall = fn.mock.calls[1];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('push');
    expect(argsArg[1]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:latest`
    );

    mockCall = fn.mock.calls[2];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('tag');
    expect(argsArg[1]).toBe(`${context.projectName}:1.0.0`);
    expect(argsArg[2]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:1.0.0`
    );

    mockCall = fn.mock.calls[3];
    commandArg = mockCall[0];
    argsArg = mockCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('push');
    expect(argsArg[1]).toBe(
      `${options.dockerRepoOrUser}/${context.projectName}:1.0.0`
    );
  });
});
