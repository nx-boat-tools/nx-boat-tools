import * as path from 'path';
import each from 'jest-each';
import { Console } from 'console';
import {
  ProjectType,
  Tree,
  addProjectConfiguration,
  names,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { DotnetTestGeneratorSchema } from './schema';
import {
  createTestSlnContent,
  readProjectsFromSolutionContent,
} from '../../utilities/slnFileHelper';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const testTypes = ['mstest', 'nunit', 'xunit'];

describe('Dotnet test Generator', () => {
  each(testTypes).describe('testType %s', (testType) => {
    let appTree: Tree;

    beforeEach(() => {
      appTree = createTreeWithEmptyWorkspace();

      console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
    });

    afterEach(() => {
      console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
    });

    it('fails when project does not exist', async () => {
      const options: DotnetTestGeneratorSchema = {
        project: 'my-project2',
        testType: testType,
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

    it('fails when project already contains target (no test prefix)', async () => {
      const options: DotnetTestGeneratorSchema = {
        project: 'my-project',
        testType: testType,
      };

      addProjectConfiguration(appTree, 'my-project', {
        root: 'apps/my-project',
        sourceRoot: 'apps/my-project/src',
        projectType: 'application',

        targets: createTargetConfig([
          { name: 'testSrc', echo: 'Hello from testSrc' },
        ]),
      });

      expect(defuse(generator(appTree, options))).rejects.toThrow(
        `${options.project} already has a testSrc target.`
      );
    });

    it('fails when project already contains target (test prefix specified)', async () => {
      const options: DotnetTestGeneratorSchema = {
        project: 'my-project',
        testType: testType,
        testPrefix: 'integration',
      };

      addProjectConfiguration(appTree, 'my-project', {
        root: 'apps/my-project',
        sourceRoot: 'apps/my-project/src',
        projectType: 'application',

        targets: createTargetConfig([
          { name: 'testIntegration', echo: 'Hello from testIntegration' },
        ]),
      });

      expect(defuse(generator(appTree, options))).rejects.toThrow(
        `${options.project} already has a testIntegration target.`
      );
    });

    it('fails when sln file not found', async () => {
      const options: DotnetTestGeneratorSchema = {
        project: 'my-project',
        testType: testType,
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
        `Unable to find the solution file for project '${options.project}'`
      );
    });

    each([
      ['', 'Src'],
      ['integration', 'Integration'],
    ]).describe('testPrefix %s', (testPrefix, testSuffix) => {
      it(`adds test${testSuffix} to project config (prefix: ${testPrefix})`, async () => {
        const options: DotnetTestGeneratorSchema = {
          project: 'my-project',
          testType: testType,
          testPrefix: testPrefix,
        };
        const projectNames = names(options.project);
        const prefixClassName = names(options.testPrefix).className;
        const initConfig = {
          root: 'apps/my-project',
          sourceRoot: 'apps/my-project/src',
          projectType: 'application' as ProjectType,

          targets: createTargetConfig([
            { name: 'build', echo: 'Hello from build' },
          ]),
        };
        addProjectConfiguration(appTree, 'my-project', initConfig);

        appTree.write(
          path.join(initConfig.root, `${projectNames.className}.sln`),
          createTestSlnContent([
            { root: initConfig.root, name: projectNames.className },
          ])
        );

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        const target = `test${testSuffix}`;
        expect(config?.targets).toBeDefined();
        expect(config.targets[target]).toBeDefined();
        expect(config.targets[target].executor).toBe(
          '@nx-boat-tools/dotnet:test'
        );

        expect(config.targets[target].options?.srcPath).toBe(
          path.join(
            config.root,
            'tests',
            `${projectNames.className}.${prefixClassName}Tests`,
            `${projectNames.className}.${prefixClassName}Tests.csproj`
          )
        );
        expect(config.targets[target].options?.outputPath).toBe(
          path.join('dist', config.root)
        );
        expect(config.targets[target].options?.configuration).toBe('Debug');

        expect(config.targets[target].configurations?.prod).toBeDefined();
        expect(config.targets[target].configurations?.prod?.configuration).toBe(
          'Release'
        );
      });

      it(`adds test project sln (prefix: '${testPrefix}', project solution does not exist)`, async () => {
        const options: DotnetTestGeneratorSchema = {
          project: 'my-project',
          testType: testType,
          testPrefix: testPrefix,
        };
        const projectNames = names(options.project);
        const prefixClassName = names(options.testPrefix).className;
        const initConfig = {
          root: 'apps/my-project',
          sourceRoot: 'apps/my-project/src',
          projectType: 'application' as ProjectType,

          targets: createTargetConfig([
            { name: 'build', echo: 'Hello from build' },
          ]),
        };
        addProjectConfiguration(appTree, 'my-project', initConfig);

        appTree.write('package.json', '{ "name": "myWorkspace" }');
        appTree.write(
          path.join('.', 'MyWorkspace.sln'),
          createTestSlnContent([
            { root: initConfig.root, name: projectNames.className },
          ])
        );

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');
        const projectPath = path.join(
          config.root,
          'tests',
          `${projectNames.className}.${prefixClassName}Tests`,
          `${projectNames.className}.${prefixClassName}Tests.csproj`
        );

        expect(appTree.exists(projectPath)).toBe(true);
      });

      it(`adds test project sln (prefix: '${testPrefix}', project solution exists)`, async () => {
        const options: DotnetTestGeneratorSchema = {
          project: 'my-project',
          testType: testType,
          testPrefix: testPrefix,
        };
        const projectNames = names(options.project);
        const prefixClassName = names(options.testPrefix).className;
        const initConfig = {
          root: 'apps/my-project',
          sourceRoot: 'apps/my-project/src',
          projectType: 'application' as ProjectType,

          targets: createTargetConfig([
            { name: 'build', echo: 'Hello from build' },
          ]),
        };
        addProjectConfiguration(appTree, 'my-project', initConfig);

        appTree.write('package.json', '{ "name": "myWorkspace" }');
        appTree.write(
          path.join(initConfig.root, `${projectNames.className}.sln`),
          createTestSlnContent([
            { root: initConfig.root, name: projectNames.className },
          ])
        );
        //by including a root solution, we can ensure the project gets picked up first if it exists
        appTree.write(
          path.join('.', 'MyWorkspace.sln'),
          createTestSlnContent([{ root: '.', name: 'someProject' }])
        );

        await generator(appTree, options);

        const slnProjects = readProjectsFromSolutionContent(
          appTree
            .read(path.join(initConfig.root, `${projectNames.className}.sln`))
            .toString(),
          ''
        );

        expect(slnProjects).toContain(
          path.join(
            'tests',
            `${projectNames.className}.${prefixClassName}Tests`,
            `${projectNames.className}.${prefixClassName}Tests.csproj`
          )
        );
      });

      it(`adds test project sln (prefix: '${testPrefix}', project solution does not exist)`, async () => {
        const options: DotnetTestGeneratorSchema = {
          project: 'my-project',
          testType: testType,
          testPrefix: testPrefix,
        };
        const projectNames = names(options.project);
        const prefixClassName = names(options.testPrefix).className;
        const initConfig = {
          root: 'apps/my-project',
          sourceRoot: 'apps/my-project/src',
          projectType: 'application' as ProjectType,

          targets: createTargetConfig([
            { name: 'build', echo: 'Hello from build' },
          ]),
        };
        addProjectConfiguration(appTree, 'my-project', initConfig);

        appTree.write('package.json', '{ "name": "myWorkspace" }');
        appTree.write(
          path.join('.', 'MyWorkspace.sln'),
          createTestSlnContent([
            { root: initConfig.root, name: projectNames.className },
          ])
        );

        await generator(appTree, options);

        const slnProjects = readProjectsFromSolutionContent(
          appTree.read(path.join('.', 'MyWorkspace.sln')).toString(),
          ''
        );

        expect(slnProjects).toContain(
          path.join(
            initConfig.root,
            'tests',
            `${projectNames.className}.${prefixClassName}Tests`,
            `${projectNames.className}.${prefixClassName}Tests.csproj`
          )
        );
      });
    });
  });
});
