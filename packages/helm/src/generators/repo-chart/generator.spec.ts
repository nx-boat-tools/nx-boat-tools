import * as _ from 'underscore';
import * as child_process from 'child_process';
import * as mockFs from 'mock-fs';
import { Console } from 'console';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { HelmRepoChartGeneratorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const fakeValues = 'test: This is a fake values file';

const spy = jest.spyOn(child_process, 'spawnSync');
const fn = jest.fn((command, args) => {
  return {
    pid: 1,
    output: [fakeValues],
    stdout: `Mock spawnSync (Command: '${command}', Args: '${args.join(' ')}')\n`,
    stderr: '',
    status: 0,
    signal: null,
  };
});

describe('repo-chart generator', () => {
  let appTree: Tree;

  beforeAll(() => {
    spy.mockImplementation(fn);
  });

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    fn.mockClear();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when project does not exist', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'test',
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
      `Cannot find configuration for '${options.project}' in /workspace.json.`
    );
  });

  it('fails when helm target already exists for project', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };

    addProjectConfiguration(appTree, 'my-project', {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'copyHelmValues', echo: 'Hello from copyHelmValues' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `${options.project} already has a copyHelmValues target.`
    );
  });

  it('does not add packageHelmChart to project config', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.packageHelmChart).toBeUndefined();
  });

  it('adds build to project config when build target does not already exists', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'buildSrc', echo: 'Hello from buildSrc' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');
    const projectHelmPath = path.join(initialConfig.root, 'helm');
    const projectDistPath = path.join('dist', initialConfig.root, 'helm');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/helm:copyValues'
    );
    expect(config.targets.build.options?.projectHelmPath).toBe(projectHelmPath);
    expect(config.targets.build.options?.outputPath).toBe(
      path.join(projectDistPath, 'values')
    );
  });

  it('adds copyHelmValues to project config when build target already exists', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');
    const projectHelmPath = path.join(initialConfig.root, 'helm');
    const projectDistPath = path.join('dist', initialConfig.root, 'helm');

    expect(config?.targets?.copyHelmValues).toBeDefined();
    expect(config.targets.copyHelmValues.executor).toBe(
      '@nx-boat-tools/helm:copyValues'
    );
    expect(config.targets.copyHelmValues.options?.projectHelmPath).toBe(
      projectHelmPath
    );
    expect(config.targets.copyHelmValues.options?.outputPath).toBe(
      path.join(projectDistPath, 'values')
    );
  });

  it('renames build target to buildSrc when already exists and not chain-execute', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.buildSrc).toBeDefined();
    expect(config.targets.buildSrc.executor).toBe(
      '@nrwl/workspace:run-commands'
    );
    expect(config.targets.buildSrc.options?.commands?.length).toBe(1);
    expect(config.targets.buildSrc.options?.commands[0]?.command).toBe(
      `echo 'Hello from build'`
    );
  });

  it('creates chain-execute build target when build already exists (existing build not chain-execute)', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.build.options?.targets?.length).toBe(2);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(config.targets.build.options?.targets[1]).toBe('copyHelmValues');
    expect(config.targets.build.configurations?.prod?.additionalTargets).toBeUndefined();
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute)', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: {
        ...createTargetConfig([
          { name: 'buildSrc', echo: 'Hello from buildSrc' },
          { name: 'test', echo: 'Hello from test' },
        ]),
        build: {
          executor: '@nx-boat-tools/common:chain-execute',
          options: {
            targets: ['buildSrc', 'test'],
          },
        },
      },
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.build.options?.targets?.length).toBe(3);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(config.targets.build.options?.targets[1]).toBe('test');
    expect(config.targets.build.options?.targets[2]).toBe('copyHelmValues');
  });

  it('sorts targets alphabetically', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: {
        ...createTargetConfig([
          { name: 'test', echo: 'Hello from test' },
          { name: 'buildSrc', echo: 'Hello from buildSrc' },
        ]),
        build: {
          executor: '@nx-boat-tools/common:chain-execute',
          options: {
            targets: ['buildSrc', 'test'],
          },
        },
      },
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');
    const targets = _.keys(config?.targets);

    expect(targets.length).toBe(4);
    expect(targets[0]).toBe('build');
    expect(targets[1]).toBe('buildSrc');
    expect(targets[2]).toBe('copyHelmValues');
    expect(targets[3]).toBe('test');
  });

  it('does not add chart files to project helm directory', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const chartPath = path.join(initialConfig.root, 'helm', 'chart');

    expect(appTree.exists(chartPath)).toBe(false);
  });

  it('adds project values.yaml when createValues true (no environments specified', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('show');
    expect(argsArg[1]).toBe('values');
    expect(argsArg[2]).toBe(`${options.repository}/${options.chart}`);

    const valuesPath = path.join(initialConfig.root, 'helm', 'values.yaml');

    expect(appTree.exists(valuesPath)).toBe(true);
    expect(appTree.read(valuesPath).toString()).toBe(fakeValues);
  });

  it('adds project values.yaml when createValues true (environments specified', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
      environments: 'dev,prod',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    expect(fn.mock.calls.length).toBe(1);

    const firstCall = fn.mock.calls[0];
    const commandArg: string = firstCall[0];
    const argsArg: string[] = firstCall[1];

    expect(commandArg).toBe('helm');
    expect(argsArg[0]).toBe('show');
    expect(argsArg[1]).toBe('values');
    expect(argsArg[2]).toBe(`${options.repository}/${options.chart}`);

    const valuesPath = path.join(initialConfig.root, 'helm', 'values.yaml');
    const devValuesPath = path.join(
      initialConfig.root,
      'helm',
      'values-dev.yaml'
    );
    const prodValuesPath = path.join(
      initialConfig.root,
      'helm',
      'values-prod.yaml'
    );

    expect(appTree.exists(valuesPath)).toBe(false);

    expect(appTree.exists(devValuesPath)).toBe(true);
    expect(appTree.read(devValuesPath).toString()).toBe(fakeValues);

    expect(appTree.exists(prodValuesPath)).toBe(true);
    expect(appTree.read(prodValuesPath).toString()).toBe(fakeValues);
  });
});
