import * as mockFs from 'mock-fs';
import { Tree, readProjectConfiguration, addProjectConfiguration, names } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Console } from 'console';
import * as _ from 'underscore';
import each from 'jest-each';

import generator from './generator';
import { DotnetGeneratorSchema } from './schema';
import { defuse } from 'packages/common/src/utilities/promiseTestHelpers';
import { createTargetConfig } from 'packages/common/src/utilities/executorTestHelpers';
import path = require('path');
import { getAllProjectsFromSolution } from '../../utilities/slnFileHelper';
import { readFileSync } from 'fs';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const appProjectTypes = ['console', 'webapi'];
const libProjectTypes = ['classlib'];

describe('dotnet project generator', () => {

  each([
    ...appProjectTypes,
    ...libProjectTypes
  ]).describe('projectType %s', (projectType) => {
    let appTree: Tree;
    let packageJsonName: string;

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace();

      let packageJson: { name: string } = JSON.parse(appTree.read('package.json').toString());
      packageJsonName = names(packageJson.name).className;


      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockFs.restore();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('fails when project already exists', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      addProjectConfiguration(appTree, "my-project", {
        root: 'apps/my-project',
        sourceRoot: 'apps/my-project/src',
        projectType: "application",

        targets: createTargetConfig([{ name: 'build', echo: 'Hello from build' }])
      })

      expect(defuse(generator(appTree, options))).rejects.toThrow(
        `Cannot create Project '${options.name}'. It already exists.`
      );
    });

    it('adds buildDotnet to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.buildDotnet).toBeDefined();
      expect(config.targets.buildDotnet.executor).toBe('@nx-boat-tools/dotnet:build');

      expect(config.targets.buildDotnet.options?.updateVersion).toBe(true);

      expect(config.targets.buildDotnet.options?.srcPath).toBe(`${packageJsonName}.sln`);
      expect(config.targets.buildDotnet.options?.outputPath).toBe(path.join('dist', config.root));
      expect(config.targets.buildDotnet.options?.configMap).toBeDefined();
      expect(config.targets.buildDotnet.options?.configMap.dev).toBe('Debug');
      expect(config.targets.buildDotnet.options?.configMap.prod).toBe('Release');

      expect(config.targets.buildDotnet.configurations?.dev).toBeDefined();
      expect(config.targets.buildDotnet.configurations?.prod).toBeDefined();
    });

    it('adds clean to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.clean).toBeDefined();
      expect(config.targets.clean.executor).toBe('@nx-boat-tools/dotnet:clean');

      expect(config.targets.clean.options?.srcPath).toBe(`${packageJsonName}.sln`);
      expect(config.targets.clean.options?.outputPath).toBe(path.join('dist', config.root));
      expect(config.targets.clean.options?.configMap).toBeDefined();
      expect(config.targets.clean.options?.configMap.dev).toBe('Debug');
      expect(config.targets.clean.options?.configMap.prod).toBe('Release');

      expect(config.targets.clean.configurations?.dev).toBeDefined();
      expect(config.targets.clean.configurations?.prod).toBeDefined();
    });

    it('adds package to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.package).toBeDefined();
      expect(config.targets.package.executor).toBe('@nx-boat-tools/dotnet:package');

      expect(config.targets.package.options?.srcPath).toBe(`${packageJsonName}.sln`);
      expect(config.targets.package.options?.outputPath).toBe(path.join('dist', config.root));
      expect(config.targets.package.options?.configMap).toBeDefined();
      expect(config.targets.package.options?.configMap.dev).toBe('Debug');
      expect(config.targets.package.options?.configMap.prod).toBe('Release');

      expect(config.targets.package.configurations?.dev).toBeDefined();
      expect(config.targets.package.configurations?.prod).toBeDefined();
    });

    it('adds build to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.build).toBeDefined();
      expect(config.targets.build.executor).toBe('@nx-boat-tools/common:chain-execute');
      expect(config.targets.build.options?.targets?.length).toBe(2);
      expect(config.targets.build.options?.targets[0]).toBe('version');
      expect(config.targets.build.options?.targets[1]).toBe('buildDotnet');


      expect(config.targets.build.configurations?.dev).toBeDefined();
      expect(config.targets.build.configurations?.prod).toBeDefined();

      expect(config.targets.build.configurations.prod.additionalTargets.length).toBe(1);
      expect(config.targets.build.configurations.prod.additionalTargets[0]).toBe('package');
    });

    it('adds csproj to project (ownSolition false)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-project');
      const projectNames = names(options.name);
      const projectPath = path.join(config.root, `${projectNames.className}.csproj`);
  
      expect(appTree.exists(projectPath)).toBe(true);
    });

    it('adds csproj to project (ownSolition true)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: true
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-project');
      const projectNames = names(options.name);
      const projectPath = path.join(config.root, projectNames.className, `${projectNames.className}.csproj`);
  
      expect(appTree.exists(projectPath)).toBe(true);
    });

    it('adds root sln containing project to workspace (ownSolution false)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-project');
      const projectNames = names(options.name);
      const slnPath = path.join(`${packageJsonName}.sln`);
  
      expect(appTree.exists(slnPath)).toBe(true);

      const slnProjects = getAllProjectsFromSolution(appTree.read(slnPath).toString(), '');

      expect(slnProjects).toContain(path.join(config.root, `${projectNames.className}.csproj`))
    });

    it('adds sln to project (ownSolution true)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: true
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-project');
      const projectNames = names(options.name);
      const slnPath = path.join(config.root, `${projectNames.className}.sln`);
  
      expect(appTree.exists(slnPath)).toBe(true);

      const slnProjects = getAllProjectsFromSolution(appTree.read(slnPath).toString(), '');

      expect(slnProjects).toContain(path.join(projectNames.className, `${projectNames.className}.csproj`))
    });

    it('adds csproj to project with directory (ownSolition false)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'grouped-my-project');
      const projectNames = names(options.name);
      const projectPath = path.join(config.root, `${projectNames.className}.csproj`);
  
      expect(appTree.exists(projectPath)).toBe(true);
    });
    
    it('adds csproj to project with directory (ownSolition true)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: true
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'grouped-my-project');
      const projectNames = names(options.name);
      const projectPath = path.join(config.root, projectNames.className, `${projectNames.className}.csproj`);
  
      expect(appTree.exists(projectPath)).toBe(true);
    });

    it('adds root sln containing project with directory to workspace (ownSolution false)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'grouped-my-project');
      const projectNames = names(options.name);
      const slnPath = path.join(`${packageJsonName}.sln`);
  
      expect(appTree.exists(slnPath)).toBe(true);

      const slnProjects = getAllProjectsFromSolution(appTree.read(slnPath).toString(), '');

      expect(slnProjects).toContain(path.join(config.root, `${projectNames.className}.csproj`))
    });

    it('adds sln to project with directory (ownSolution true)', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: true
      };

      await generator(appTree, options);

      const config = readProjectConfiguration(appTree, 'grouped-my-project');
      const projectNames = names(options.name);
      const slnPath = path.join(config.root, `${projectNames.className}.sln`);
  
      expect(appTree.exists(slnPath)).toBe(true);

      const slnProjects = getAllProjectsFromSolution(appTree.read(slnPath).toString(), '');

      expect(slnProjects).toContain(path.join(projectNames.className, `${projectNames.className}.csproj`))
    });

  });


  each([
    ...appProjectTypes
  ]).describe('projectType %s', (projectType) => {
    let appTree: Tree;
    let packageJsonName: string;

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace();

      let packageJson: { name: string } = JSON.parse(appTree.read('package.json').toString());
      packageJsonName = names(packageJson.name).className;

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockFs.restore();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('adds project as Nx application', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
      expect(config?.projectType).toBe('application');
      expect(config?.root).toBe(path.join('apps', options.name))
    });

    it('adds project as Nx application with directory', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'grouped-my-project');

      expect(config).toBeDefined();
      expect(config?.projectType).toBe('application');
      expect(config?.root).toBe(path.join('apps', options.directory, options.name))
    });

    it('adds run to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.run).toBeDefined();
      expect(config.targets.run.executor).toBe('@nx-boat-tools/dotnet:run');

      expect(config.targets.run.options?.srcPath).toBe(`${packageJsonName}.sln`);
      expect(config.targets.run.options?.outputPath).toBe(path.join('dist', config.root));
      expect(config.targets.run.options?.configMap).toBeDefined();
      expect(config.targets.run.options?.configMap.dev).toBe('Debug');
      expect(config.targets.run.options?.configMap.prod).toBe('Release');

      expect(config.targets.run.configurations?.dev).toBeDefined();
      expect(config.targets.run.configurations?.prod).toBeDefined();
    });
  });

  each([
    ...libProjectTypes
  ]).describe('projectType %s', (projectType) => {
    let appTree: Tree;
    let packageJsonName: string ;

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace();

      let packageJson: { name: string } = JSON.parse(appTree.read('package.json').toString());
      packageJsonName = names(packageJson.name).className;

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      mockFs.restore();

      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('adds project as Nx library', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config).toBeDefined();
      expect(config?.projectType).toBe('library');
      expect(config?.root).toBe(path.join('libs', options.name))
    });

    it('adds project as Nx library with directory', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        directory: 'grouped',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'grouped-my-project');

      expect(config).toBeDefined();
      expect(config?.projectType).toBe('library');
      expect(config?.root).toBe(path.join('libs', options.directory, options.name))
    });

    it('does not add run to project config', async () => {
      const options: DotnetGeneratorSchema = {
        name: 'my-project',
        projectType: projectType,
        ownSolution: false
      };

      await generator(appTree, options)

      const config = readProjectConfiguration(appTree, 'my-project');

      expect(config?.targets?.run).toBeUndefined();
    });
  });
});
