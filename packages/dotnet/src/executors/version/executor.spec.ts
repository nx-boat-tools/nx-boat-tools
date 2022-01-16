import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import each from 'jest-each';
import { Console } from 'console';
import { createTestExecutorContext, defuse } from '@nx-boat-tools/common';
import { readFileSync } from 'fs';

import executor from './executor';
import { DotNetVersionExecutorSchema } from './schema';
import { createTestCsprojContent } from '../../utilities/csprojFileHelper';
import { createTestSlnContent } from '../../utilities/slnFileHelper';

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

describe('Run Dotnet Command Executor', () => {
  beforeAll(() => {
    spy.mockImplementation(fn);
  });

  afterAll(() => {
    fn.mockRestore();
  });

  beforeEach(() => {
    fn.mockClear();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it("fails when project is 'undefined'", async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    context.projectName = undefined;

    expect(defuse(executor(options, context))).rejects.toThrow(
      'You must specify a project!'
    );
  });

  each([[undefined], ['']]).it(
    "fails when srcPath is '%s'",
    async (srcPath) => {
      const options: DotNetVersionExecutorSchema = {
        srcPath: srcPath,
      };
      const context = createTestExecutorContext({
        configurationName: 'prod',
        targetsMap: [{ name: 'version', echo: 'hello from version' }],
      });

      expect(defuse(executor(options, context))).rejects.toThrow(
        'You must specify the location of the csproj file for the project.'
      );
    }
  );

  it('fails when srcPath does not exist', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, 'apps')] = {
      /** empty directory */
    };

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to locate src path, '${path.join(context.root, options.srcPath)}'`
    );
  });

  each([
    ['apps/my-project', { 'test.sln': '', 'package.json': '{}' }],
    [
      'apps/my-project/test',
      {
        /** empty directory */
      },
    ],
    ['apps/my-project/test', ''],
    ['apps/my-project/test.temp', ''],
    ['apps/my-project/test.csproj.old', ''],
  ]).it(
    'fails when srcPath not csproj or sln (%s)',
    async (srcPath, srcPathContents) => {
      const options: DotNetVersionExecutorSchema = {
        srcPath: srcPath,
      };
      const context = createTestExecutorContext({
        configurationName: 'prod',
        targetsMap: [{ name: 'version', echo: 'hello from version' }],
      });

      const fakeFs = {};
      fakeFs[path.join(context.root, options.srcPath)] = srcPathContents;

      if (srcPath !== 'apps/my-project') {
        //we have to define the package.json above for the project root and can't do it here
        fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
          '{}';
      }

      console.log('Mocked fs', fakeFs);

      mockFs(fakeFs);

      expect(defuse(executor(options, context))).rejects.toThrow(
        "The dotnet project file must have an extenstion of '.csproj' or '.sln'"
      );
    }
  );

  it('fails when no project package.json exists (csproj)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.csproj',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to detect version. No package.json found at '${path.join(
        context.root,
        context.workspace.projects[context.projectName].root,
        'package.json'
      )}'!`
    );
  });

  it('updates csproj versions when package.json exists (csproj)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.csproj',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();
    fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
      '{}';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    const csproj = readFileSync(
      path.join(context.root, options.srcPath)
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.0</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.0</PackageVersion>')
    ).toBeGreaterThan(0);
  });

  it('updates csproj versions when package.json exists with version (csproj)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.csproj',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] =
      createTestCsprojContent();
    fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
      '{ "version": "1.2.3" }';

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    const csproj = readFileSync(
      path.join(context.root, options.srcPath)
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>1.2.3</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>1.2.3</PackageVersion>')
    ).toBeGreaterThan(0);
  });

  it('fails when no project package.json exists (sln)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.sln',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    expect(defuse(executor(options, context))).rejects.toThrow(
      `Unable to detect version. No package.json found at '${path.join(
        context.root,
        context.workspace.projects[context.projectName].root,
        'package.json'
      )}'!`
    );
  });

  it('updates csproj versions package.json exists (sln)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.sln',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
      '{}';
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    let csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.0</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.0</PackageVersion>')
    ).toBeGreaterThan(0);

    csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>0.0.0</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>0.0.0</PackageVersion>')
    ).toBeGreaterThan(0);
  });

  it('updates csproj versions package.json exists with version (sln)', async () => {
    const options: DotNetVersionExecutorSchema = {
      srcPath: 'apps/my-project/test.sln',
    };
    const context = createTestExecutorContext({
      configurationName: 'prod',
      targetsMap: [{ name: 'version', echo: 'hello from version' }],
    });

    const fakeFs = {};
    fakeFs[path.join(context.root, 'apps', 'my-project', 'package.json')] =
      '{ "version": "1.2.3" }';
    fakeFs[path.join(context.root, options.srcPath)] = createTestSlnContent([
      'SampleProject1',
      'SampleProject2',
    ]);
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ] = createTestCsprojContent();
    fakeFs[
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ] = createTestCsprojContent();

    console.log('Mocked fs', fakeFs);

    mockFs(fakeFs);

    const output = await executor(options, context);

    expect(output.success).toBe(true);

    let csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject1',
        'SampleProject1.csproj'
      )
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>1.2.3</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>1.2.3</PackageVersion>')
    ).toBeGreaterThan(0);

    csproj = readFileSync(
      path.join(
        context.root,
        'apps/my-project',
        'SampleProject2',
        'SampleProject2.csproj'
      )
    ).toString();
    expect(
      csproj.indexOf('<ReleaseVersion>1.2.3</ReleaseVersion>')
    ).toBeGreaterThan(0);
    expect(
      csproj.indexOf('<PackageVersion>1.2.3</PackageVersion>')
    ).toBeGreaterThan(0);
  });
});
