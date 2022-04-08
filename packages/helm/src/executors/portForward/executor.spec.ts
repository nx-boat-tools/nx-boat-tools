import * as common from '@nx-boat-tools/common';
import * as mockFs from 'mock-fs';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';

import executor from './executor';
import { HelmUninstallRepoChartExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

jest.mock('@nx-boat-tools/common', () => ({
  ...jest.requireActual<any>('@nx-boat-tools/common'), // eslint-disable-line
  spawnDetached: jest.fn((command, args) =>
    Promise.resolve(
      `Mock mockSpawnDetached (Command: '${command}', Args: '${args?.join(
        ' '
      )}')\n`
    )
  ),
}));
const spawnDetachedSpy = jest.spyOn(common, 'spawnDetached');

describe('Helm PortForward Executor', () => {
  afterAll(() => {
    mockFs.restore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when no project specified', async () => {
    const options: HelmUninstallRepoChartExecutorSchema = {
      resourceName: 'deployment/my-project',
      hostPort: 8080,
      containerPort: 80,
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

  it('fails when no resource specified', async () => {
    const options: HelmUninstallRepoChartExecutorSchema = {
      resourceName: undefined,
      hostPort: 8080,
      containerPort: 80,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `No resource specified.`
    );
  });

  it('fails when no host port specified', async () => {
    const options: HelmUninstallRepoChartExecutorSchema = {
      resourceName: 'deployment/my-project',
      hostPort: undefined,
      containerPort: 80,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `No host port specified.`
    );
  });

  it('fails when no container port specified', async () => {
    const options: HelmUninstallRepoChartExecutorSchema = {
      resourceName: 'deployment/my-project',
      hostPort: 8080,
      containerPort: undefined,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `No container port specified.`
    );
  });

  it('creates the correct Helm CLI command', async () => {
    const options: HelmUninstallRepoChartExecutorSchema = {
      resourceName: 'deployment/my-project',
      hostPort: 8080,
      containerPort: 80,
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
    expect(spawnDetachedSpy.mock.calls.length).toBe(1);

    const firstCall = spawnDetachedSpy.mock.calls[0];
    const command: string = firstCall[0];
    const args: string[] = firstCall[1];

    const commandParts = command?.split(' ');

    expect(commandParts).toBeDefined();
    expect(commandParts[0]).toBe('kubectl');
    expect(commandParts[1]).toBe('port-forward');
    expect(commandParts[2]).toBe(`deployment/${context.projectName}`);
    expect(commandParts[3]).toBe('8080:80');
    expect(args).toBeUndefined();
  });
});
