import * as _ from 'underscore';
import * as mockFs from 'mock-fs';
import { Console } from 'console';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { CommonChainGeneratorSchema } from './schema';

import { createTargetConfig } from '../../utilities/executorTestHelpers';
import { defuse } from '../../utilities/promiseTestHelpers';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('commmon chain generator', () => {
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
    const options: CommonChainGeneratorSchema = {
      project: 'test',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
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

  it('renames target with Src suffix when already exists and not chain-execute', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'build',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
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

  it('creates chain-execute target when target does not already exists', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
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

    expect(config?.targets?.chainTarget).toBeDefined();
    expect(config.targets.chainTarget.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );

    expect(
      config.targets.chainTarget.options?.preTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.preTargets[0]).toBe(
      'pre1'
    );
    expect(config.targets.chainTarget.options?.preTargets[1]).toBe(
      'pre2'
    );

    expect(
      config.targets.chainTarget.options?.targets?.length
    ).toBe(1);
    expect(config.targets.chainTarget.options?.targets[0]).toBe(
      'target1'
    );

    expect(
      config.targets.chainTarget.options?.postTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.postTargets[0]).toBe(
      'post1'
    );
    expect(config.targets.chainTarget.options?.postTargets[1]).toBe(
      'post2'
    );
  });

  it('creates chain-execute target when target already exists (existing build not chain-execute)', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'chainTarget', echo: 'Hello from chainExecute' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.chainTarget).toBeDefined();
    expect(config.targets.chainTarget.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );
    
    expect(
      config.targets.chainTarget.options?.preTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.preTargets[0]).toBe(
      'pre1'
    );
    expect(config.targets.chainTarget.options?.preTargets[1]).toBe(
      'pre2'
    );

    expect(
      config.targets.chainTarget.options?.targets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.targets[0]).toBe(
      'chainTargetSrc'
    );
    expect(config.targets.chainTarget.options?.targets[1]).toBe(
      'target1'
    );

    expect(
      config.targets.chainTarget.options?.postTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.postTargets[0]).toBe(
      'post1'
    );
    expect(config.targets.chainTarget.options?.postTargets[1]).toBe(
      'post2'
    );
  });

  it('adds to chain-execute target when target already exists (existing build chain-execute)', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: {
        ...createTargetConfig([
          { name: 'chainTargetSrc', echo: 'Hello from chainTargetSrc' },
          { name: 'lint', echo: 'Hello from lint' },
          { name: 'test', echo: 'Hello from test' },
        ]),
        chainTarget: {
          executor: '@nx-boat-tools/common:chain-execute',
          options: {
            preTargets: ['lint'],
            targets: ['chainTargetSrc'],
            postTargets: ['test'],
          },
        },
      },
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.chainTarget).toBeDefined();
    expect(config.targets.chainTarget.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );

    expect(
      config.targets.chainTarget.options?.preTargets?.length
    ).toBe(3);
    expect(config.targets.chainTarget.options?.preTargets[0]).toBe(
      'lint'
    );
    expect(config.targets.chainTarget.options?.preTargets[1]).toBe(
      'pre1'
    );
    expect(config.targets.chainTarget.options?.preTargets[2]).toBe(
      'pre2'
    );

    expect(
      config.targets.chainTarget.options?.targets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.targets[0]).toBe(
      'chainTargetSrc'
    );
    expect(config.targets.chainTarget.options?.targets[1]).toBe(
      'target1'
    );

    expect(
      config.targets.chainTarget.options?.postTargets?.length
    ).toBe(3);
    expect(config.targets.chainTarget.options?.postTargets[0]).toBe(
      'test'
    );
    expect(config.targets.chainTarget.options?.postTargets[1]).toBe(
      'post1'
    );
    expect(config.targets.chainTarget.options?.postTargets[2]).toBe(
      'post2'
    );
  });

  it('adds to chain-execute target when target already exists (existing build chain-execute with stage)', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
    };
    const initialConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: {
        ...createTargetConfig([
          { name: 'chainTargetSrc', echo: 'Hello from chainTargetSrc' },
          { name: 'test', echo: 'Hello from test' },
        ]),
        chainTarget: {
          executor: '@nx-boat-tools/common:chain-execute',
          options: {
            stages: {
              src: {
                targets: ['chainTargetSrc', 'test'],
              },
            },
          },
        },
      },
    };

    addProjectConfiguration(appTree, 'my-project', initialConfig);

    await generator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-project');

    expect(config?.targets?.chainTarget).toBeDefined();
    expect(config.targets.chainTarget.executor).toBe(
      '@nx-boat-tools/common:chain-execute'
    );

    expect(
      config.targets.chainTarget.options?.preTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.preTargets[0]).toBe(
      'pre1'
    );
    expect(config.targets.chainTarget.options?.preTargets[1]).toBe(
      'pre2'
    );

    expect(
      config.targets.chainTarget.options?.targets?.length
    ).toBe(1);
    expect(config.targets.chainTarget.options?.targets[0]).toBe(
      'target1'
    );

    expect(
      config.targets.chainTarget.options?.postTargets?.length
    ).toBe(2);
    expect(config.targets.chainTarget.options?.postTargets[0]).toBe(
      'post1'
    );
    expect(config.targets.chainTarget.options?.postTargets[1]).toBe(
      'post2'
    );

    expect(config.targets.chainTarget.options?.stages?.src).toBeDefined();
    expect(config.targets.chainTarget.options?.stages?.src?.targets?.length).toBe(2);
    expect(config.targets.chainTarget.options?.stages?.src?.targets[0]).toBe(
      'chainTargetSrc'
    );
    expect(config.targets.chainTarget.options?.stages?.src?.targets[1]).toBe('test');
  });

  it('sorts targets alphabetically', async () => {
    const options: CommonChainGeneratorSchema = {
      project: 'my-project',
      name: 'chainTarget',
      preTargets: 'pre1,pre2',
      targets: 'target1',
      postTargets: 'post1,post2'
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
    expect(targets[2]).toBe('chainTarget');
    expect(targets[3]).toBe('test');
  });
});
