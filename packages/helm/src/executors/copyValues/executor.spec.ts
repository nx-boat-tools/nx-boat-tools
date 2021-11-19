import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { existsSync, readFileSync } from 'fs';

import executor from './executor';
import { HelmCopyValuesExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('Helm Copy Values Executor', () => {
  beforeEach(() => {
    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when no project specified', async () => {
    const options: HelmCopyValuesExecutorSchema = {
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
    const options: HelmCopyValuesExecutorSchema = {
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
    const options: HelmCopyValuesExecutorSchema = {
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
    const options: HelmCopyValuesExecutorSchema = {
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
    const options: HelmCopyValuesExecutorSchema = {
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

  it('copies values files to output folder', async () => {
    const options: HelmCopyValuesExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.projectHelmPath)] = {
      'values.yaml': '{}',
      'values-dev.yaml': '{}',
      'values-prod.yaml': '{}',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(
      existsSync(path.join(context.root, options.outputPath, 'values.yaml'))
    ).toBe(true);
    expect(
      existsSync(path.join(context.root, options.outputPath, 'values-dev.yaml'))
    ).toBe(true);
    expect(
      existsSync(
        path.join(context.root, options.outputPath, 'values-prod.yaml')
      )
    ).toBe(true);
  });

  it('copies values files matching the source files', async () => {
    const options: HelmCopyValuesExecutorSchema = {
      projectHelmPath: 'apps/my-project/helm',
      outputPath: 'dist/apps/my-project/helm/values',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.projectHelmPath)] = {
      'values.yaml': 'This is a test',
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(
      existsSync(path.join(context.root, options.outputPath, 'values.yaml'))
    ).toBe(true);
    expect(
      readFileSync(
        path.join(context.root, options.outputPath, 'values.yaml')
      ).toString()
    ).toBe('This is a test');
  });
});
