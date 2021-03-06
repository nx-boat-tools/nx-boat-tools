import * as _ from 'underscore';
import { Console } from 'console';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { readFileSync } from 'fs';

import generator from './generator';
import { HelmLocalChartGeneratorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('local-chart generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when project does not exist', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'test',
      createValues: false,
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
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

  it('adds copyHelmValues to project config', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

  it('adds lintHelmChart to project config', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    expect(config?.targets?.lintHelmChart).toBeDefined();
    expect(config.targets.lintHelmChart.executor).toBe(
      '@nx-boat-tools/helm:lint'
    );
    expect(config.targets.lintHelmChart.options?.projectHelmPath).toBe(
      projectHelmPath
    );
  });

  it('adds packageHelmChart to project config', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    expect(config?.targets?.packageHelmChart).toBeDefined();
    expect(config.targets.packageHelmChart.executor).toBe(
      '@nx-boat-tools/helm:package'
    );
    expect(config.targets.packageHelmChart.options?.projectHelmPath).toBe(
      projectHelmPath
    );
    expect(config.targets.packageHelmChart.options?.outputPath).toBe(
      path.join(projectDistPath, 'chart')
    );
  });

  it('adds installHelmChart to project config (no environments specified)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
      '@nx-boat-tools/helm:installLocalChart'
    );
    expect(config.targets.installHelmChart.options?.projectHelmPath).toBe(
      projectHelmPath
    );
    expect(
      config.targets.installHelmChart.options?.valuesFilePaths?.length
    ).toBe(1);
    expect(config.targets.installHelmChart.options?.valuesFilePaths[0]).toBe(
      valuesPath
    );
  });

  it('adds portForwardToMinikube to project config (default run args)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

  it('renames build target to buildSrc when already exists and not chain-execute', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

  it('adds build to project config when build target does not already exists', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.build.options?.targets).toBeUndefined();
    expect(
      config.targets.build.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.build.options?.stages?.helmChart?.targets[0]).toBe(
      'lintHelmChart'
    );
  });

  it('creates chain-execute build target when build already exists (existing build not chain-execute)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    expect(config.targets.build.options?.targets?.length).toBe(1);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(
      config.targets.build.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.build.options?.stages?.helmChart?.targets[0]).toBe(
      'lintHelmChart'
    );
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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
    expect(config.targets.build.options?.targets?.length).toBe(2);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(config.targets.build.options?.targets[1]).toBe('test');
    expect(
      config.targets.build.options?.stages?.helmChart?.targets.length
    ).toBe(1);
    expect(config.targets.build.options?.stages?.helmChart?.targets[0]).toBe(
      'lintHelmChart'
    );
  });

  it('sorts targets alphabetically', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    expect(targets.length).toBe(11);
    expect(targets[0]).toBe('build');
    expect(targets[1]).toBe('buildSrc');
    expect(targets[2]).toBe('copyHelmValues');
    expect(targets[3]).toBe('installHelmChart');
    expect(targets[4]).toBe('lintHelmChart');
    expect(targets[5]).toBe('package');
    expect(targets[6]).toBe('packageHelmChart');
    expect(targets[7]).toBe('portForwardToMinikube');
    expect(targets[8]).toBe('runHelmChart');
    expect(targets[9]).toBe('test');
    expect(targets[10]).toBe('uninstallHelmChart');
  });

  it('adds chart.yaml file to chart files in project helm directory matching template', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    const chartPath = path.join(
      initialConfig.root,
      'helm',
      'chart',
      'Chart.yaml'
    );
    const chartTemplate = readFileSync(
      path.join(__dirname, 'files', 'generated', 'Chart.yaml.template')
    )
      .toString()
      .replace('<%= name %>', options.project);

    expect(appTree.exists(chartPath)).toBe(true);
    expect(appTree.read(chartPath).toString()).toBe(chartTemplate);
  });

  it('adds values.yaml file to chart files in project helm directory matching template', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    const valuesPath = path.join(
      initialConfig.root,
      'helm',
      'chart',
      'values.yaml'
    );
    const valuesTemplate = readFileSync(
      path.join(__dirname, 'files', 'generated', 'values.yaml.template')
    )
      .toString()
      .replace('<%= name %>', options.project);

    expect(appTree.exists(valuesPath)).toBe(true);
    expect(appTree.read(valuesPath).toString()).toBe(valuesTemplate);
  });

  it('adds .helmignore file to chart files in project helm directory matching template', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    const helmignorePath = path.join(
      initialConfig.root,
      'helm',
      'chart',
      '.helmignore'
    );
    const helmignoreTemplate = readFileSync(
      path.join(__dirname, 'files', 'generated', '__dot__helmignore.template')
    )
      .toString()
      .replace('<%= name %>', options.project);

    expect(appTree.exists(helmignorePath)).toBe(true);
    expect(appTree.read(helmignorePath).toString()).toBe(helmignoreTemplate);
  });

  it('adds templates directory to chart files in project helm directory', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    const templatesDirPath = path.join(
      initialConfig.root,
      'helm',
      'chart',
      'templates'
    );

    expect(appTree.exists(templatesDirPath)).toBe(true);
  });

  it('does not add project values.yaml when createValues false', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: false,
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

    const valuesPath = path.join(initialConfig.root, 'helm', 'values.yaml');

    expect(appTree.exists(valuesPath)).toBe(false);
  });

  it('adds project values.yaml when createValues true (no environments specified)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: true,
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

    const valuesPath = path.join(initialConfig.root, 'helm', 'values.yaml');
    const valuesTemplate = readFileSync(
      path.join(__dirname, 'files', 'generated', 'values.yaml.template')
    )
      .toString()
      .replace('<%= name %>', options.project);

    expect(appTree.exists(valuesPath)).toBe(true);
    expect(appTree.read(valuesPath).toString()).toBe(valuesTemplate);
  });

  it('adds project values.yaml when createValues true (environments specified)', async () => {
    const options: HelmLocalChartGeneratorSchema = {
      project: 'my-project',
      createValues: true,
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
    const valuesTemplate = readFileSync(
      path.join(__dirname, 'files', 'generated', 'values.yaml.template')
    )
      .toString()
      .replace('<%= name %>', options.project);

    expect(appTree.exists(valuesPath)).toBe(true);
    expect(appTree.read(valuesPath).toString()).toBe(valuesTemplate);

    expect(appTree.exists(devValuesPath)).toBe(true);
    expect(appTree.read(devValuesPath).toString()).toBe(valuesTemplate);

    expect(appTree.exists(prodValuesPath)).toBe(true);
    expect(appTree.read(prodValuesPath).toString()).toBe(valuesTemplate);
  });
});
