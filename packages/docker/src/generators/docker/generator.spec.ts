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
        { name: 'buildDocker', echo: 'Hello from buildDocker' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `${options.project} already has a buildDocker target.`
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

  it('adds runDockerImage to project config', async () => {
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
    expect(config.targets.runDockerImage.options?.vars).toBeUndefined();
    expect(config.targets.runDockerImage.options?.ports['8080']).toBe(80);
    expect(config.targets.runDockerImage.options?.mounts).toBeDefined();
    expect(config.targets.runDockerImage.options?.mounts[distPath]).toBe(
      '/usr/share/nginx/html'
    );
  });

  it('adds build to project config when build target does not already exists', async () => {
    const options: DockerGeneratorSchema = {
      project: 'my-project',
      dockerRepoOrUser: 'myusername',
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
    const distPath = path.join('dist', initialConfig.root);

    expect(config?.targets?.build).toBeDefined();
    expect(config.targets.build.executor).toBe(
      '@nx-boat-tools/docker:copyFiles'
    );
    expect(config.targets.build.options?.distPath).toBe(distPath);
  });

  it('adds copyDockerFiles to project config when build target already exists', async () => {
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

  it('adds buildMinikubeImage to project config when --minikube=false', async () => {
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
    expect(config.targets.build.options?.targets?.length).toBe(2);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(config.targets.build.options?.targets[1]).toBe('copyDockerFiles');
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
    expect(config.targets.build.options?.targets?.length).toBe(3);
    expect(config.targets.build.options?.targets[0]).toBe('buildSrc');
    expect(config.targets.build.options?.targets[1]).toBe('test');
    expect(config.targets.build.options?.targets[2]).toBe('copyDockerFiles');
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

    expect(targets.length).toBe(7);
    expect(targets[0]).toBe('build');
    expect(targets[1]).toBe('buildDockerImage');
    expect(targets[2]).toBe('buildSrc');
    expect(targets[3]).toBe('copyDockerFiles');
    expect(targets[4]).toBe('publishDockerImage');
    expect(targets[5]).toBe('runDockerImage');
    expect(targets[6]).toBe('test');
  });

  it('adds dockerfile to project matching template', async () => {
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
    const dockerfileTemplate = readFileSync(
      path.join(__dirname, 'files', 'dockerfile')
    ).toString();

    expect(appTree.exists(projectPath)).toBe(true);
    expect(appTree.read(projectPath).toString()).toBe(dockerfileTemplate);
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
      path.join(__dirname, 'files', '__dot__dockerignore')
    ).toString();

    expect(appTree.exists(projectPath)).toBe(true);
    expect(appTree.read(projectPath).toString()).toBe(dockerignoreTemplate);
  });
});
