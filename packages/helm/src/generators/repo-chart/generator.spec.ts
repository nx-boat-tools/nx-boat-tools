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
    stdout: `Mock spawnSync (Command: '${command}', Args: '${args.join(
      ' '
    )}')\n`,
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

  it('does not add lintHelmChart to project config', async () => {
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

    expect(config?.targets?.lintHelmChart).toBeUndefined();
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

  it('adds copyHelmValues to project config', async () => {
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

  it('adds installHelmChart to project config (no environments specified)', async () => {
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
    const valuesPath = path.join(initialConfig.root, 'helm', 'values.yaml');

    expect(config?.targets?.installHelmChart).toBeDefined();
    expect(config.targets.installHelmChart.executor).toBe(
      '@nx-boat-tools/helm:installRepoChart'
    );
    expect(config.targets.installHelmChart.options?.projectHelmPath).toBe(
      projectHelmPath
    );
    expect(config.targets.installHelmChart.options?.repository).toBe(
      options.repository
    );
    expect(config.targets.installHelmChart.options?.chart).toBe(options.chart);
    expect(
      config.targets.installHelmChart.options?.valuesFilePaths?.length
    ).toBe(1);
    expect(config.targets.installHelmChart.options?.valuesFilePaths[0]).toBe(
      valuesPath
    );
  });

  it('adds portForwardToMinikube to project config (default run args)', async () => {
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

    expect(config?.targets?.portForwardToMinikube).toBeDefined();
    expect(config.targets.portForwardToMinikube.executor).toBe(
      '@nx-boat-tools/helm:portForward'
    );
    expect(config.targets.portForwardToMinikube.options?.resourceName).toBe(
      `deploymenet/${options.project}`
    );
    expect(config.targets.portForwardToMinikube.options?.hostPort).toBe(8080);
    expect(config.targets.portForwardToMinikube.options?.containerPort).toBe(
      80
    );
  });

  it('adds portForwardToMinikube to project config (custom run args)', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
      runResourceName: 'pod/test123',
      runHostPort: 8888,
      runContainerPort: 9999,
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

    expect(config?.targets?.portForwardToMinikube).toBeDefined();
    expect(config.targets.portForwardToMinikube.executor).toBe(
      '@nx-boat-tools/helm:portForward'
    );
    expect(config.targets.portForwardToMinikube.options?.resourceName).toBe(
      options.runResourceName
    );
    expect(config.targets.portForwardToMinikube.options?.hostPort).toBe(8888);
    expect(config.targets.portForwardToMinikube.options?.containerPort).toBe(
      9999
    );
  });

  it('adds uninstallHelmChart to project config', async () => {
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

    expect(config?.targets?.uninstallHelmChart).toBeDefined();
    expect(config.targets.uninstallHelmChart.executor).toBe(
      '@nx-boat-tools/helm:uninstall'
    );
    expect(
      config.targets.uninstallHelmChart.options?.resourceName
    ).toBeUndefined();
  });

  it('adds runHelmChart to project config (no buildTarget specified)', async () => {
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
        { name: 'packageSrc', echo: 'Hello from packageSrc' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.runHelmChart).toBeDefined();
    expect(config.targets.runHelmChart.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.runHelmChart.options?.targets).toBeUndefined();
    expect(config.targets.runHelmChart.options?.postTargets?.length).toBe(3);
    expect(config.targets.runHelmChart.options?.postTargets[0]).toBe(
      'installHelmChart'
    );
    expect(config.targets.runHelmChart.options?.postTargets[1]).toBe(
      'portForwardToMinikube'
    );
    expect(config.targets.runHelmChart.options?.postTargets[2]).toBe(
      'uninstallHelmChart'
    );
    expect(config.targets.runHelmChart.options?.stages).toBeUndefined();
  });

  it('adds runHelmChart to project config (buildTarget specified)', async () => {
    const options: HelmRepoChartGeneratorSchema = {
      project: 'my-project',
      repository: 'bitnami',
      chart: 'mysql',
      runBuildTarget: 'buildSrc',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'packageSrc', echo: 'Hello from packageSrc' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.runHelmChart).toBeDefined();
    expect(config.targets.runHelmChart.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.runHelmChart.options?.targets).toBeUndefined();
    expect(config.targets.runHelmChart.options?.postTargets?.length).toBe(3);
    expect(config.targets.runHelmChart.options?.postTargets[0]).toBe(
      'installHelmChart'
    );
    expect(config.targets.runHelmChart.options?.postTargets[1]).toBe(
      'portForwardToMinikube'
    );
    expect(config.targets.runHelmChart.options?.postTargets[2]).toBe(
      'uninstallHelmChart'
    );
    expect(config.targets.runHelmChart.options?.stages).toBeDefined();
    expect(config.targets.runHelmChart.options?.stages['build']).toBeDefined();
    expect(
      config.targets.runHelmChart.options?.stages['build']?.postTargets
    ).toBeUndefined();
    expect(
      config.targets.runHelmChart.options?.stages['build']?.targets?.length
    ).toBe(1);
    expect(
      config.targets.runHelmChart.options?.stages['build']?.targets[0]
    ).toBe('buildSrc');
  });

  it('does not rename build target to buildSrc when already exists and not chain-execute', async () => {
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
    expect(config.targets.build.executor).toBe('@nrwl/workspace:run-commands');
    expect(config.targets.build.options?.commands?.length).toBe(1);
    expect(config.targets.build.options?.commands[0]?.command).toBe(
      `echo 'Hello from build'`
    );
  });

  it('renames package target to packageSrc when already exists and not chain-execute', async () => {
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
        { name: 'package', echo: 'Hello from package' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.packageSrc).toBeDefined();
    expect(config.targets.packageSrc.executor).toBe(
      '@nrwl/workspace:run-commands'
    );
    expect(config.targets.packageSrc.options?.commands?.length).toBe(1);
    expect(config.targets.packageSrc.options?.commands[0]?.command).toBe(
      `echo 'Hello from package'`
    );
  });

  it('adds package to project config when package target does not already exists', async () => {
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
        { name: 'packageSrc', echo: 'Hello from packageSrc' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.package).toBeDefined();
    expect(config.targets.package.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.package.options?.targets).toBeUndefined();
    expect(
      config.targets.package.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.package.options?.stages?.helmChart?.targets[0]).toBe(
      'copyHelmValues'
    );
  });

  it('creates chain-execute package target when package already exists (existing package not chain-execute)', async () => {
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
        { name: 'package', echo: 'Hello from package' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.package).toBeDefined();
    expect(config.targets.package.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.package.options?.targets?.length).toBe(1);
    expect(config.targets.package.options?.targets[0]).toBe('packageSrc');
    expect(
      config.targets.package.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.package.options?.stages?.helmChart?.targets[0]).toBe(
      'copyHelmValues'
    );
  });

  it('adds to chain-execute package target when package already exists (existing package chain-execute)', async () => {
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
          { name: 'packageSrc', echo: 'Hello from packageSrc' },
          { name: 'test', echo: 'Hello from test' },
        ]),
        package: {
          executor: '@nx-boat-tools/common:chain-execute',
          options: {
            targets: ['packageSrc', 'test'],
          },
        },
      },
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.package).toBeDefined();
    expect(config.targets.package.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.package.options?.targets?.length).toBe(2);
    expect(config.targets.package.options?.targets[0]).toBe('packageSrc');
    expect(config.targets.package.options?.targets[1]).toBe('test');
    expect(
      config.targets.package.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.package.options?.stages?.helmChart?.targets[0]).toBe(
      'copyHelmValues'
    );
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

    expect(targets.length).toBe(9);
    expect(targets[0]).toBe('build');
    expect(targets[1]).toBe('buildSrc');
    expect(targets[2]).toBe('copyHelmValues');
    expect(targets[3]).toBe('installHelmChart');
    expect(targets[4]).toBe('package');
    expect(targets[5]).toBe('portForwardToMinikube');
    expect(targets[6]).toBe('runHelmChart');
    expect(targets[7]).toBe('test');
    expect(targets[8]).toBe('uninstallHelmChart');
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

  it('adds project values.yaml when createValues true (no environments specified)', async () => {
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

  it('adds project values.yaml when createValues true (environments specified)', async () => {
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

    expect(appTree.exists(valuesPath)).toBe(true);
    expect(appTree.read(valuesPath).toString()).toBe(fakeValues);

    expect(appTree.exists(devValuesPath)).toBe(true);
    expect(appTree.read(devValuesPath).toString()).toBe(fakeValues);

    expect(appTree.exists(prodValuesPath)).toBe(true);
    expect(appTree.read(prodValuesPath).toString()).toBe(fakeValues);
  });
});
