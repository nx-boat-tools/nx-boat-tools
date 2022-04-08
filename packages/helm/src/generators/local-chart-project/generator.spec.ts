import * as _ from 'underscore';
import each from 'jest-each';
import { Console } from 'console';
import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import * as localChartGenerator from '../local-chart/generator';
import generator from './generator';
import { HelmLocalChartGeneratorSchema } from '../local-chart/schema';
import { HelmLocalChartProjectGeneratorSchema } from './schema';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(localChartGenerator, 'default');
const mockedLocalChartGenerator = jest.fn(
  (tree: Tree, options: HelmLocalChartGeneratorSchema): Promise<void> => {
    console.log('Called mock helm local-chart generator', options);

    return Promise.resolve();
  }
);

describe('local-chart-project generator', () => {
  describe('workspace v1', () => {
    let appTree: Tree;

    beforeAll(() => {
      spy.mockImplementation(mockedLocalChartGenerator);
    });

    afterAll(() => {
      mockedLocalChartGenerator.mockRestore();
    });

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace(1);

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockedLocalChartGenerator.mockClear();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('saves configuration to workspace.json by default', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
      };

      await generator(appTree, options);

      const changes = _.map(appTree.listChanges(), (change) =>
        path.basename(change.path)
      );

      expect(changes).not.toContain('project.json');
      expect(changes).toContain('workspace.json');

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
    });
  });

  describe('workspace v2', () => {
    let appTree: Tree;

    beforeAll(() => {
      spy.mockImplementation(mockedLocalChartGenerator);
    });

    afterAll(() => {
      mockedLocalChartGenerator.mockRestore();
    });

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace(2);

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockedLocalChartGenerator.mockClear();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('saves configuration to project.json by default', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
      };

      await generator(appTree, options);

      const changes = _.map(appTree.listChanges(), (change) =>
        path.basename(change.path)
      );

      expect(changes).toContain('project.json');

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
    });

    it('saves configuration to project.json when isStandaloneConfig is true', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
        isStandaloneConfig: true,
      };

      await generator(appTree, options);

      const changes = _.map(appTree.listChanges(), (change) =>
        path.basename(change.path)
      );

      expect(changes).toContain('project.json');

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
    });

    it('saves configuration to workspace.json when isStandaloneConfig is false', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
        isStandaloneConfig: false,
      };

      await generator(appTree, options);

      const changes = _.map(appTree.listChanges(), (change) =>
        path.basename(change.path)
      );

      expect(changes).not.toContain('project.json');
      expect(changes).toContain('workspace.json');

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
    });
  });

  each([1, 2]).describe('workspace v%s', (workspaceVersion) => {
    let appTree: Tree;

    beforeAll(() => {
      spy.mockImplementation(mockedLocalChartGenerator);
    });

    afterAll(() => {
      mockedLocalChartGenerator.mockRestore();
    });

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace(workspaceVersion);

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockedLocalChartGenerator.mockClear();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('fails when project already exists', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
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
        `Cannot create Project '${options.name}'. It already exists.`
      );
    });

    it('adds dependencies to workspace', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        createValues: false,
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
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        createValues: false,
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
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
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
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.projectType).toBe('application');
      expect(config?.root).toBe('apps/my-project');
      expect(config?.sourceRoot).toBe('apps/my-project/src');
    });

    it('adds version to project config', async () => {
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
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
      const options: HelmLocalChartProjectGeneratorSchema = {
        name: 'my-project',
        createValues: false,
      };

      await generator(appTree, options);

      expect(mockedLocalChartGenerator.mock.calls.length).toBe(1);

      const firstCall: any[] = mockedLocalChartGenerator.mock.calls[0]; //eslint-disable-line
      const schemaArg: HelmLocalChartGeneratorSchema = firstCall[1];

      expect(schemaArg.project).toBe(options.name);
      expect(schemaArg.environments).toBe(options.environments);
      expect(schemaArg.createValues).toBe(options.createValues);
    });
  });
});
