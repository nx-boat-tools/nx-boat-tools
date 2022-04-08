import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';

import executor from './executor';
import { HelmLintExecutorSchema } from './schema';

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

describe('Helm Lint Executor', () => {
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
    const options: HelmLintExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
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
    const options: HelmLintExecutorSchema = {
      projectHelmPath: undefined,
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

  it('fails when project helm folder does not exist', async () => {
    const options: HelmLintExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
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

  it('creates the correct Helm CLI command', async () => {
    const options: HelmLintExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
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
    expect(argsArg[0]).toBe('lint');
    expect(argsArg[1]).toBe(
      path.join(context.root, options.projectHelmPath, 'chart')
    );
    expect(argsArg[2]).toBe('--strict');
  });
});
