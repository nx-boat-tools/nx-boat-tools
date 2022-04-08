import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import { Console } from 'console';
import { ExecutorContext } from '@nrwl/devkit';
import { createTestExecutorContext } from '@nx-boat-tools/common';

import * as buildDocker from '../build/executor';
import executor from './executor';
import { BuildExecutorSchema } from '../build/schema';
import { MinikubeBuildExecutorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const runExecutorSpy = jest.spyOn(buildDocker, 'dockerBuildExecutor');
const mockedRunExecutor = jest.fn(
  async (
    options: BuildExecutorSchema, // eslint-disable-line @typescript-eslint/no-unused-vars
    context: ExecutorContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    spawnArgs?: child_process.SpawnSyncOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    return { success: true };
  }
);
const execSyncSpy = jest.spyOn(child_process, 'execSync');
const mockedExecSync = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (command: string) => {
    const results = `
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://10.211.55.3:2376"
export DOCKER_CERT_PATH="/Users/user/.minikube/certs"
export MINIKUBE_ACTIVE_DOCKERD="minikube"`;
    const buffer = Buffer.from(results, 'utf-8');
    return buffer;
  }
);

describe('Minikube Build Executor', () => {
  beforeAll(() => {
    runExecutorSpy.mockImplementation(mockedRunExecutor);
    execSyncSpy.mockImplementation(mockedExecSync);

    process.env.minikube_test_arg = 'this is a test';
  });

  afterAll(() => {
    mockedRunExecutor.mockRestore();

    process.env.minikube_test_arg = undefined;
  });

  beforeEach(() => {
    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();
    mockedRunExecutor.mockClear();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('successfully calls docker build', async () => {
    const options: MinikubeBuildExecutorSchema = {
      buildPath: 'apps/my-project',
      dockerFilePath: 'apps/my-project/dockerfile',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'docker build', echo: 'hello from docker build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.buildPath)] = {
      dockerfile: '',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);
    expect(output.success).toBe(true);
    expect(mockedRunExecutor.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedRunExecutor.mock.calls[0]; //eslint-disable-line
    const optionsArg: BuildExecutorSchema = firstCall[0];
    const contextArg: ExecutorContext = firstCall[1];
    const spawnArgs: child_process.SpawnSyncOptions = firstCall[2];

    console.log('env', process.env);

    expect(optionsArg.buildPath).toBe('apps/my-project');
    expect(optionsArg.dockerFilePath).toBe('apps/my-project/dockerfile');
    expect(contextArg).toBe(context);
    expect(spawnArgs?.env).toBeDefined();
    expect(spawnArgs.env.DOCKER_TLS_VERIFY).toBe('1');
    expect(spawnArgs.env.DOCKER_HOST).toBe('tcp://10.211.55.3:2376');
    expect(spawnArgs.env.DOCKER_CERT_PATH).toBe('/Users/user/.minikube/certs');
    expect(spawnArgs.env.MINIKUBE_ACTIVE_DOCKERD).toBe('minikube');
    expect(spawnArgs.env.minikube_test_arg).toBe('this is a test');
  });
});
