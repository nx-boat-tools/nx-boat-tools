import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';

import executor from './executor';
import { HelmInstallRepoChartExecutorSchema } from './schema';

import path = require('path');

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

describe('Helm Install Executor', () => {
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
    const options: HelmInstallRepoChartExecutorSchema = {
      repository: 'bitnami',
      chart: 'mysql',
      valuesFilePaths: ['apps/my-project/helm/values.yaml'],
      dryRun: false,
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

  it('fails when no repository specified', async () => {
    const options: HelmInstallRepoChartExecutorSchema = {
      repository: undefined,
      chart: 'mysql',
      valuesFilePaths: ['apps/my-project/helm/values.yaml'],
      dryRun: false,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify a repository.`
    );
  });

  it('fails when no chart specified', async () => {
    const options: HelmInstallRepoChartExecutorSchema = {
      repository: 'bitnami',
      chart: undefined,
      valuesFilePaths: ['apps/my-project/helm/values.yaml'],
      dryRun: false,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify a chart name.`
    );
  });

  it('adds dry run flag when specified', async () => {
    const options: HelmInstallRepoChartExecutorSchema = {
      repository: 'bitnami',
      chart: 'mysql',
      valuesFilePaths: [],
      dryRun: true,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('upgrade');
    expect(argsArg[1]).toBe(context.projectName);
    expect(argsArg[2]).toBe(`${options.repository}/${options.chart}`);
    expect(argsArg[3]).toBe('-i');
    expect(argsArg[4]).toBe('--verify');
    expect(argsArg[5]).toBe('--dry-run');
  });

  it('creates the correct Helm CLI command', async () => {
    const options: HelmInstallRepoChartExecutorSchema = {
      repository: 'bitnami',
      chart: 'mysql',
      valuesFilePaths: ['apps/my-project/helm/values.yaml'],
      dryRun: false,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('upgrade');
    expect(argsArg[1]).toBe(context.projectName);
    expect(argsArg[2]).toBe(`${options.repository}/${options.chart}`);
    expect(argsArg[3]).toBe('-i');
    expect(argsArg[4]).toBe('--verify');
    expect(argsArg[5]).toBe('-f');
    expect(argsArg[6]).toBe(
      path.join(context.root, options.valuesFilePaths[0])
    );
    expect(argsArg[7]).toBeUndefined();
  });
});
