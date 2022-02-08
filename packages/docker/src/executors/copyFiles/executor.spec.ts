import * as mockFs from 'mock-fs';
import * as path from 'path';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { existsSync, readFileSync } from 'fs';

import executor from './executor';
import { DockerCopyFilesExecutorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('Docker Copy Files Executor', () => {
  beforeEach(() => {
    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when no project specified', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      distPath: 'dist/apps/my-project',
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

  it('fails when no dist directory specified', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      distPath: undefined,
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify a dist path.`
    );
  });

  it('fails when no dockerfile specified', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: undefined,
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `You must specify the dockerfile path.`
    );
  });

  it('fails when dockerfile does not exist', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `${context.projectName} does not have a dockerfile.`
    );
  });

  it('creates output folder when does not exist', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.dockerFilePath)] = '';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    const outputDirExists = existsSync(
      path.join(context.root, options.distPath)
    );

    expect(output.success).toBe(true);
    expect(outputDirExists).toBe(true);
  });

  it('copies the dockerfile file to dist folder (dockerfile)', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.dockerFilePath)] =
      'This is a dockerfile';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(
      existsSync(path.join(context.root, options.distPath, 'dockerfile'))
    ).toBe(true);
    expect(
      readFileSync(
        path.join(context.root, options.distPath, 'dockerfile')
      ).toString()
    ).toBe('This is a dockerfile');
  });

  it('copies the dockerfile file to dist folder (dockerfile.prod)', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile.prod',
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.dockerFilePath)] =
      'This is a dockerfile';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(
      existsSync(path.join(context.root, options.distPath, 'dockerfile.prod'))
    ).toBe(true);
    expect(
      readFileSync(
        path.join(context.root, options.distPath, 'dockerfile.prod')
      ).toString()
    ).toBe('This is a dockerfile');
  });

  it('copies the dockerignore file to dist folder if present', async () => {
    const options: DockerCopyFilesExecutorSchema = {
      dockerFilePath: 'apps/my-project/dockerfile',
      dockerIgnorePath: 'apps/my-project/.dockerignore',
      distPath: 'dist/apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'build', echo: 'hello from build' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.dockerFilePath)] =
      'This is a dockerfile';
    fakeFs[path.join(context.root, options.dockerIgnorePath)] =
      'This is a .dockerignore';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    expect(
      existsSync(path.join(context.root, options.distPath, '.dockerignore'))
    ).toBe(true);
    expect(
      readFileSync(
        path.join(context.root, options.distPath, '.dockerignore')
      ).toString()
    ).toBe('This is a .dockerignore');
  });
});
