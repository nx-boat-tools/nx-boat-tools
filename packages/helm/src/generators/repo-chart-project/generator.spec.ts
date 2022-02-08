import { Console } from 'console';
import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import * as repoChartGenerator from '../repo-chart/generator';
import generator from './generator';
import { HelmRepoChartGeneratorSchema } from '../repo-chart/schema';
import { HelmRepoChartProjectGeneratorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(repoChartGenerator, 'default');
const mockedRepoChartGenerator = jest.fn(
  (tree: Tree, options: HelmRepoChartGeneratorSchema): Promise<void> => {
    console.log('Called mock helm local-chart generator', options);

    return Promise.resolve();
  }
);

describe('repo-chart-project generator', () => {
  let appTree: Tree;

  beforeAll(() => {
    spy.mockImplementation(mockedRepoChartGenerator);
  });

  afterAll(() => {
    mockedRepoChartGenerator.mockRestore();
  });

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockedRepoChartGenerator.mockClear();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when project already exists', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    addProjectConfiguration(appTree, 'my-project', {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',

      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Cannot create Project '${options.name}'. It already exists.`
    );
  });

  it('adds dependencies to workspace', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      directory: 'grouped',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    const workspacePackageJsonPath = path.join('.', 'package.json');

    expect(appTree.exists(workspacePackageJsonPath)).toBe(true);

    const packageJsonBuffer = appTree.read(workspacePackageJsonPath);
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    expect(packageJson?.devDependencies).toBeDefined();
    expect(packageJson?.devDependencies['@jscutlery/semver']).toBeDefined();
  });

  it('adds package.json to project with directory', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      directory: 'grouped',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'grouped-my-project');
    const packageJsonPath = path.join(config.root, 'package.json');

    expect(appTree.exists(packageJsonPath)).toBe(true);

    const packageJsonBuffer = appTree.read(packageJsonPath);
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    expect(packageJson?.name).toBe('my-project');
    expect(packageJson?.version).toBe('0.0.1');
  });

  it('adds package.json to project', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');
    const packageJsonPath = path.join(config.root, 'package.json');

    expect(appTree.exists(packageJsonPath)).toBe(true);

    const packageJsonBuffer = appTree.read(packageJsonPath);
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    expect(packageJson?.name).toBe('my-project');
    expect(packageJson?.version).toBe('0.0.1');
  });

  it('adds project config', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.projectType).toBe('application');
    expect(config?.root).toBe('apps/my-project');
    expect(config?.sourceRoot).toBe('apps/my-project/src');
  });

  it('adds version to project config', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.version).toBeDefined();
    expect(config.targets.version.executor).toBe('@jscutlery/semver:version');
    expect(config.targets.version.options?.syncVersions).toBeUndefined();
    expect(config.targets.version.options?.baseBranch).toBeUndefined();
    expect(config.targets.version.options?.commitMessageFormat).toBe(
      'chore(${projectName}): release version ${version}'
    );
  });

  it('successfully calls the helm local-chart Generator', async () => {
    const options: HelmRepoChartProjectGeneratorSchema = {
      name: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    await generator(appTree, options);

    expect(mockedRepoChartGenerator.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedRepoChartGenerator.mock.calls[0];
    const schemaArg: HelmRepoChartGeneratorSchema = firstCall[1];

    expect(schemaArg.project).toBe(options.name);
    expect(schemaArg.environments).toBe(options.environments);
    expect(schemaArg.repository).toBe(options.repository);
    expect(schemaArg.chart).toBe(options.chart);
  });
});
