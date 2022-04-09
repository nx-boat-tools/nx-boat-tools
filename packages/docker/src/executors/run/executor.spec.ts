import * as child_process from 'child_process';
import * as devkit from '@nrwl/devkit';
import * as path from 'path';
import { Console } from 'console';
import {
  createTestExecutorContext,
  defuse,
  promiseToAsyncIterator,
} from '@nx-boat-tools/common';

import executor from './executor';
import { DockerRunExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spawnSpy = jest.spyOn(child_process, 'spawnSync');
const mockSpawn = jest.fn((command, args) => {
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

const nxRunExecutorSpy = jest.spyOn(devkit, 'runExecutor');
const mockNxRunExecutor = jest.fn(
  (targetDescription: {
    project: string;
    target: string;
    configuration?: string;
  }) => {
    const success = targetDescription.configuration !== 'fail';

    console.log(`Mocking build. Success: ${success}`);

    return Promise.resolve(
      promiseToAsyncIterator(Promise.resolve({ success: success }))
    );
  }
);

describe('Docker Run Executor', () => {
  beforeAll(() => {
    spawnSpy.mockImplementation(mockSpawn);
    nxRunExecutorSpy.mockImplementation(mockNxRunExecutor);
  });

  beforeEach(() => {
    mockSpawn.mockClear();
    mockNxRunExecutor.mockClear();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when no project specified', async () => {
    const options: DockerRunExecutorSchema = {};
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    context.projectName = undefined;

    expect(defuse(executor(options, context))).rejects.toThrow(
      `No project specified.`
    );
  });

  it('does not call Docker CLI build command when build target fails', async () => {
    const options: DockerRunExecutorSchema = {
      buildTarget: 'build:fail',
      vars: {
        MY_VAR: 'some value',
        ENV: 'prod',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
    expect(mockNxRunExecutor.mock.calls.length).toBe(1);
    expect(mockSpawn.mock.calls.length).toBe(0);
  });

  it('calls Docker CLI build command when build target does not fail (no configuration)', async () => {
    const options: DockerRunExecutorSchema = {
      buildTarget: 'build',
      vars: {
        MY_VAR: 'some value',
        ENV: 'prod',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(1);
    expect(mockSpawn.mock.calls.length).toBe(1);
  });

  it('calls Docker CLI build command when build target does not fail (configuration specified)', async () => {
    const options: DockerRunExecutorSchema = {
      buildTarget: 'build:prod',
      vars: {
        MY_VAR: 'some value',
        ENV: 'prod',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(1);
    expect(mockSpawn.mock.calls.length).toBe(1);
  });

  it('creates the correct Docker CLI build command with vars', async () => {
    const options: DockerRunExecutorSchema = {
      vars: {
        MY_VAR: 'some value',
        ENV: 'prod',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(0);
    expect(mockSpawn.mock.calls.length).toBe(1);

    const firstCall = mockSpawn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--rm');
    expect(argsArg[2]).toBe('-e');
    expect(argsArg[3]).toBe('MY_VAR=somevalue');
    expect(argsArg[4]).toBe('-e');
    expect(argsArg[5]).toBe('ENV=prod');
    expect(argsArg[6]).toBe(context.projectName);
  });

  it('creates the correct Docker CLI build command with ports', async () => {
    const options: DockerRunExecutorSchema = {
      ports: {
        '8080': '80',
        '4433': '443',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(0);
    expect(mockSpawn.mock.calls.length).toBe(1);

    const firstCall = mockSpawn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--rm');
    expect(argsArg[2]).toBe('-p');
    expect(argsArg[3]).toBe('4433:443'); //4433 is first since we're mapping ports by the keys which is sorted
    expect(argsArg[4]).toBe('-p');
    expect(argsArg[5]).toBe('8080:80');
    expect(argsArg[6]).toBe(context.projectName);
  });

  it('creates the correct Docker CLI build command with ports', async () => {
    const options: DockerRunExecutorSchema = {
      mounts: {
        '/my/host/path': '/container/path',
        '/my/host/config': '/container/path/config',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(0);
    expect(mockSpawn.mock.calls.length).toBe(1);

    const firstCall = mockSpawn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    const fullHostPath1 = path.join(context.root, 'my', 'host', 'path');
    const fullHostPath2 = path.join(context.root, 'my', 'host', 'config');

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--rm');
    expect(argsArg[2]).toBe('-v');
    expect(argsArg[3]).toBe(`${fullHostPath1}:/container/path`);
    expect(argsArg[4]).toBe('-v');
    expect(argsArg[5]).toBe(`${fullHostPath2}:/container/path/config`);
    expect(argsArg[6]).toBe(context.projectName);
  });

  it('creates the correct Docker CLI build command with all options', async () => {
    const options: DockerRunExecutorSchema = {
      vars: {
        MY_VAR: 'some value',
        ENV: 'prod',
      },
      ports: {
        '8080': '80',
        '4433': '443',
      },
      mounts: {
        '/my/host/path': '/container/path',
        '/my/host/config': '/container/path/config',
      },
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(mockNxRunExecutor.mock.calls.length).toBe(0);
    expect(mockSpawn.mock.calls.length).toBe(1);

    const firstCall = mockSpawn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    const fullHostPath1 = path.join(context.root, 'my', 'host', 'path');
    const fullHostPath2 = path.join(context.root, 'my', 'host', 'config');

    expect(commandArg).toBe('docker');
    expect(argsArg[0]).toBe('run');
    expect(argsArg[1]).toBe('--rm');
    expect(argsArg[2]).toBe('-e');
    expect(argsArg[3]).toBe('MY_VAR=somevalue');
    expect(argsArg[4]).toBe('-e');
    expect(argsArg[5]).toBe('ENV=prod');
    expect(argsArg[6]).toBe('-p');
    expect(argsArg[7]).toBe('4433:443'); //4433 is first since we're mapping ports by the keys which is sorted
    expect(argsArg[8]).toBe('-p');
    expect(argsArg[9]).toBe('8080:80');
    expect(argsArg[10]).toBe('-v');
    expect(argsArg[11]).toBe(`${fullHostPath1}:/container/path`);
    expect(argsArg[12]).toBe('-v');
    expect(argsArg[13]).toBe(`${fullHostPath2}:/container/path/config`);
    expect(argsArg[14]).toBe(context.projectName);
  });
});
