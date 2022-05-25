import * as _ from 'underscore';
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
import { readFileSync } from 'fs';

import generator from './generator';
import { DockerGeneratorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('docker generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when project does not exist', async () => {
    const options: DockerGeneratorSchema = {
      project: 'test',
      dockerRepoOrUser: 'myusername',
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

  it('fails when docker target already exists for project', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
    };

    addProjectConfiguration(appTree, 'my-project', {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'buildDockerImage', echo: 'Hello from buildDockerImage' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `${options.project} already has a buildDockerImage target.`
    );
  });

  it('adds buildDockerImage to project config', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config?.targets?.buildDockerImage).toBeDefined();
    expect(config.targets.buildDockerImage.executor).toBe(
      '@nx-boat-tools/docker:build'
    );
    expect(config.targets.buildDockerImage.options?.dockerFilePath).toBe(
      path.join(initialConfig.root, 'dockerfile')
    );
    expect(config.targets.buildDockerImage.options?.buildPath).toBe(
      path.join('dist', initialConfig.root)
    );
  });

  it('adds copyDockerFiles to project config', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.copyDockerFiles).toBeDefined();
    expect(config.targets.copyDockerFiles.executor).toBe(
      '@nx-boat-tools/docker:copyFiles'
    );
    expect(config.targets.copyDockerFiles.options?.dockerFilePath).toBe(
      path.join(initialConfig.root, 'dockerfile')
    );
    expect(config.targets.copyDockerFiles.options?.dockerIgnorePath).toBe(
      path.join(initialConfig.root, '.dockerignore')
    );
    expect(config.targets.copyDockerFiles.options?.distPath).toBe(distPath);
  });

  it('adds publishDockerImage to project config', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config?.targets?.publishDockerImage).toBeDefined();
    expect(config.targets.publishDockerImage.executor).toBe(
      '@nx-boat-tools/docker:publish'
    );
    expect(config.targets.publishDockerImage.options?.buildPath).toBe(
      path.join('dist', initialConfig.root)
    );
    expect(config.targets.publishDockerImage.options?.dockerRepoOrUser).toBe(
      options.dockerRepoOrUser
    );
  });

  it('adds runDockerImage to project config (default args)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('adds runDockerImage to project config (single port specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runPortMappings: '5001:5000',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['5001']).toBe(5000);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('adds runDockerImage to project config (multiple ports specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runPortMappings: '5001:5000,5003:5002',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['5001']).toBe(5000);
    expect(config.targets.runDockerImage.options?.ports['5003']).toBe(5002);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('adds runDockerImage to project config (single mount specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runVolumeMounts: '/host/path:/container/path',
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

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts['/host/path']).toBe(
      '/container/path'
    );
  });

  it('adds runDockerImage to project config (multiple mounts specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runVolumeMounts:
        '/host/path/1:/container/path/1,/host/path/2:/container/path/2',
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

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts['/host/path/1']).toBe(
      '/container/path/1'
    );
    expect(config.targets.runDockerImage.options?.mounts['/host/path/2']).toBe(
      '/container/path/2'
    );
  });

  it('adds runDockerImage to project config (single var specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runVariables: 'SomeVar:SomeValue',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeDefined();
    expect(config.targets.runDockerImage.options?.vars['SomeVar']).toBe(
      'SomeValue'
    );
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('adds runDockerImage to project config (multiple vars specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      runVariables: 'SomeVar1:SomeValue1,SomeVar2:SomeValue2',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.runDockerImage).toBeDefined();
    expect(config.targets.runDockerImage.executor).toBe(
      '@nx-boat-tools/docker:run'
    );
    expect(config.targets.runDockerImage.options?.buildTarget).toBe('build');
    expect(config.targets.runDockerImage.options?.vars).toBeDefined();
    expect(config.targets.runDockerImage.options?.vars['SomeVar1']).toBe(
      'SomeValue1'
    );
    expect(config.targets.runDockerImage.options?.vars['SomeVar2']).toBe(
      'SomeValue2'
    );
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('does not add buildMinikubeImage to project config when --minikube=false', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: false,
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

    expect(config?.targets?.buildMinikubeImage).toBeUndefined();
  });

  it('adds buildMinikubeImage to project config when --minikube=true', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: true,
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

    expect(config?.targets?.buildMinikubeImage).toBeDefined();
    expect(config.targets.buildMinikubeImage.executor).toBe(
      '@nx-boat-tools/docker:minikubeBuild'
    );
    expect(config.targets.buildMinikubeImage.options?.dockerFilePath).toBe(
      path.join(initialConfig.root, 'dockerfile')
    );
    expect(config.targets.buildMinikubeImage.options?.buildPath).toBe(
      path.join('dist', initialConfig.root)
    );
  });

  it('renames build target to buildSrc when already exists and not chain-execute', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

  it('creates chain-execute build target when build does not already exists', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([{ name: 'test', echo: 'Hello from test' }]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.build.options?.targets).toBeUndefined();

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );
  });

  it('creates chain-execute build target when build does not already exists (--minikube=true)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: true,
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([{ name: 'test', echo: 'Hello from test' }]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.build.options?.targets).toBeUndefined();

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );

    expect(config.targets.build.options?.stages?.minikubeImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets?.length
    ).toBe(2);
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[0]
    ).toBe('copyDockerFiles');
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[1]
    ).toBe('buildMinikubeImage');
  });

  it('creates chain-execute build target when build already exists (existing build not chain-execute)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );
  });

  it('creates chain-execute build target when build already exists (existing build not chain-execute, --minikube=true)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: true,
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

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );

    expect(config.targets.build.options?.stages?.minikubeImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets?.length
    ).toBe(2);
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[0]
    ).toBe('copyDockerFiles');
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[1]
    ).toBe('buildMinikubeImage');
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute, --minikube=true)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: true,
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

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );

    expect(config.targets.build.options?.stages?.minikubeImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets?.length
    ).toBe(2);
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[0]
    ).toBe('copyDockerFiles');
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[1]
    ).toBe('buildMinikubeImage');
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute with stage)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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
            stages: {
              src: {
                targets: ['buildSrc', 'test'],
              },
            },
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
    expect(config.targets.build.options?.targets).toBeUndefined();

    expect(config.targets.build.options?.stages?.src).toBeDefined();
    expect(config.targets.build.options?.stages?.src?.targets?.length).toBe(2);
    expect(config.targets.build.options?.stages?.src?.targets[0]).toBe(
      'buildSrc'
    );
    expect(config.targets.build.options?.stages?.src?.targets[1]).toBe('test');

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets?.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );
  });

  it('adds to chain-execute build target when build already exists (existing build chain-execute with stage, --minikube=true)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      minikube: true,
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
            stages: {
              src: {
                targets: ['buildSrc', 'test'],
              },
            },
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
    expect(config.targets.build.options?.targets).toBeUndefined();

    expect(config.targets.build.options?.stages?.src).toBeDefined();
    expect(config.targets.build.options?.stages?.src?.targets?.length).toBe(2);
    expect(config.targets.build.options?.stages?.src?.targets[0]).toBe(
      'buildSrc'
    );
    expect(config.targets.build.options?.stages?.src?.targets[1]).toBe('test');

    expect(config.targets.build.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.dockerImage?.targets?.length
    ).toBe(2);
    expect(config.targets.build.options?.stages?.dockerImage?.targets[0]).toBe(
      'copyDockerFiles'
    );
    expect(config.targets.build.options?.stages?.dockerImage?.targets[1]).toBe(
      'buildDockerImage'
    );

    expect(config.targets.build.options?.stages?.minikubeImage).toBeDefined();
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets?.length
    ).toBe(2);
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[0]
    ).toBe('copyDockerFiles');
    expect(
      config.targets.build.options?.stages?.minikubeImage?.targets[1]
    ).toBe('buildMinikubeImage');
  });

  it('creates chain-execute package target when package does not already exists', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([{ name: 'test', echo: 'Hello from test' }]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.package.options?.targets).toBeUndefined();

    expect(config.targets.package.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets
        .length
    ).toBe(1);
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets[0]
    ).toBe('publishDockerImage');
  });

  it('creates chain-execute package target when package already exists (existing package not chain-execute)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    expect(config.targets.package.options?.targets?.length).toBe(1);
    expect(config.targets.package.options?.targets[0]).toBe('packageSrc');

    expect(config.targets.package.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets
        .length
    ).toBe(1);
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets[0]
    ).toBe('publishDockerImage');
  });

  it('adds to chain-execute package target when package already exists (existing package chain-execute)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(config.targets.package.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets
        .length
    ).toBe(1);
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets[0]
    ).toBe('publishDockerImage');
  });

  it('adds to chain-execute package target when package already exists (existing package chain-execute with stage)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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
            stages: {
              src: {
                targets: ['packageSrc', 'test'],
              },
            },
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
    expect(config.targets.package.options?.targets).toBeUndefined();

    expect(config.targets.package.options?.stages?.src).toBeDefined();
    expect(config.targets.package.options?.stages?.src?.targets?.length).toBe(
      2
    );
    expect(config.targets.package.options?.stages?.src?.targets[0]).toBe(
      'packageSrc'
    );
    expect(config.targets.package.options?.stages?.src?.targets[1]).toBe(
      'test'
    );

    expect(config.targets.package.options?.stages?.dockerImage).toBeDefined();
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets
        ?.length
    ).toBe(1);
    expect(
      config.targets.package.options?.stages?.dockerImage?.postTargets[0]
    ).toBe('publishDockerImage');
  });

  it('sorts targets alphabetically', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    expect(targets.length).toBe(8);
    expect(targets[0]).toBe('build');
    expect(targets[1]).toBe('buildDockerImage');
    expect(targets[2]).toBe('buildSrc');
    expect(targets[3]).toBe('copyDockerFiles');
    expect(targets[4]).toBe('package');
    expect(targets[5]).toBe('publishDockerImage');
    expect(targets[6]).toBe('runDockerImage');
    expect(targets[7]).toBe('test');
  });

  it('adds dockerfile to project matching template (default base image)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    const projectPath = path.join(initialConfig.root, 'dockerfile');

    expect(appTree.exists(projectPath)).toBe(true);
    expect(appTree.read(projectPath).toString()).toBe(
      '# Put you dockerfile definition here...\nFROM nginx:latest\n'
    );
  });

  it('adds dockerfile to project matching template (base image specified)', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
      baseDockerImage: 'someDockerImage:1.0.0',
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

    const projectPath = path.join(initialConfig.root, 'dockerfile');

    expect(appTree.exists(projectPath)).toBe(true);
    expect(appTree.read(projectPath).toString()).toBe(
      '# Put you dockerfile definition here...\nFROM someDockerImage:1.0.0\n'
    );
  });

  it('adds .dockerignore to project matching template', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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

    const projectPath = path.join(initialConfig.root, '.dockerignore');
    const dockerignoreTemplate = readFileSync(
      path.join(__dirname, 'files', '__dot__dockerignore.template')
    ).toString();

    expect(appTree.exists(projectPath)).toBe(true);
    expect(appTree.read(projectPath).toString()).toBe(dockerignoreTemplate);
  });
});
