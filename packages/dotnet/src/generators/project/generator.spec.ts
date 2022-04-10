import * as _ from 'underscore';
import * as mockFs from 'mock-fs';
import each from 'jest-each';
import { Console } from 'console';
import {
  Tree,
  addProjectConfiguration,
  names,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { readFileSync } from 'fs';

import generator from './generator';
import { DotnetGeneratorSchema } from './schema';
import { readProjectsFromSolutionContent } from '../../utilities/slnFileHelper';

import path = require('path');

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const appProjectTypes = ['console', 'webapi'];
const libProjectTypes = ['classlib'];

describe('dotnet project generator', () => {
  describe('workspace v1', () => {
    each([...appProjectTypes, ...libProjectTypes]).describe(
      'projectType %s',
      (projectType) => {
        let appTree: Tree;

        beforeEach(() => {
          appTree = createTreeWithEmptyWorkspace(1);

          console.log(
            `\nRunning Test '${expect.getState().currentTestName}'...\n`
          );
        });

        afterEach(() => {
          mockFs.restore();

          console.log(
            `\nTest '${expect.getState().currentTestName}' Complete!\n`
          );
        });

        it('saves configuration to workspace.json by default', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
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
      }
    );
  });

  describe('workspace v2', () => {
    each([...appProjectTypes, ...libProjectTypes]).describe(
      'projectType %s',
      (projectType) => {
        let appTree: Tree;

        beforeEach(() => {
          appTree = createTreeWithEmptyWorkspace(2);

          console.log(
            `\nRunning Test '${expect.getState().currentTestName}'...\n`
          );
        });

        afterEach(() => {
          mockFs.restore();

          console.log(
            `\nTest '${expect.getState().currentTestName}' Complete!\n`
          );
        });

        it('saves configuration to project.json by default', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
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
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
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
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
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
      }
    );
  });

  each([1, 2]).describe('workspace v%s', (workspaceVersion) => {
    each([...appProjectTypes, ...libProjectTypes]).describe(
      'projectType %s',
      (projectType) => {
        let appTree: Tree;
        let packageJsonName: string;

        beforeEach(() => {
          appTree = createTreeWithEmptyWorkspace(workspaceVersion);

          const packageJson: { name: string } = JSON.parse(
            appTree.read('package.json').toString()
          );
          packageJsonName = names(packageJson.name).className;

          console.log(
            `\nRunning Test '${expect.getState().currentTestName}'...\n`
          );
        });

        afterEach(() => {
          mockFs.restore();

          console.log(
            `\nTest '${expect.getState().currentTestName}' Complete!\n`
          );
        });

        it('fails when project already exists', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
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

        it('adds build to project config (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.build).toBeDefined();
          expect(config.targets.build.executor).toBe(
            '@nx-boat-tools/dotnet:build'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.csproj`
          );
          expect(config.targets.build.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.build.options?.configuration).toBe('Debug');

          expect(config.targets.build.configurations?.prod).toBeDefined();
          expect(config.targets.build.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds build to project config (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.build).toBeDefined();
          expect(config.targets.build.executor).toBe(
            '@nx-boat-tools/dotnet:build'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.sln`
          );
          expect(config.targets.build.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.build.options?.configuration).toBe('Debug');

          expect(config.targets.build.configurations?.prod).toBeDefined();
          expect(config.targets.build.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds clean to project config (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.clean).toBeDefined();
          expect(config.targets.clean.executor).toBe(
            '@nx-boat-tools/dotnet:clean'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.csproj`
          );
          expect(config.targets.clean.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.clean.options?.configuration).toBe('Debug');

          expect(config.targets.clean.configurations?.prod).toBeDefined();
          expect(config.targets.clean.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds clean to project config (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.clean).toBeDefined();
          expect(config.targets.clean.executor).toBe(
            '@nx-boat-tools/dotnet:clean'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.sln`
          );
          expect(config.targets.clean.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.clean.options?.configuration).toBe('Debug');

          expect(config.targets.clean.configurations?.prod).toBeDefined();
          expect(config.targets.clean.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds package to project config (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.package).toBeDefined();
          expect(config.targets.package.executor).toBe(
            '@nx-boat-tools/dotnet:package'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.csproj`
          );
          expect(config.targets.package.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.package.options?.configuration).toBe('Debug');

          expect(config.targets.package.configurations?.prod).toBeDefined();
          expect(config.targets.package.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds package to project config (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.package).toBeDefined();
          expect(config.targets.package.executor).toBe(
            '@nx-boat-tools/dotnet:package'
          );

          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.sln`
          );
          expect(config.targets.package.options?.outputPath).toBe(
            path.join('dist', config.root)
          );
          expect(config.targets.package.options?.configuration).toBe('Debug');

          expect(config.targets.package.configurations?.prod).toBeDefined();
          expect(config.targets.package.configurations?.prod?.configuration).toBe('Release');
        });

        it('adds dotnetVersion to project config (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.dotnetVersion).toBeDefined();
          expect(config.targets.dotnetVersion.executor).toBe(
            '@nx-boat-tools/dotnet:version'
          );
          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.csproj`
          );
        });

        it('adds dotnetVersion to project config (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };
          const projectNames = names(options.name);

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.dotnetVersion).toBeDefined();
          expect(config.targets.dotnetVersion.executor).toBe(
            '@nx-boat-tools/dotnet:version'
          );
          expect(config.targets.build.options?.srcPath).toBe(
            `${config.root}/${projectNames.className}.sln`
          );
        });

        it('adds version to project config', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');

          expect(config?.targets?.version).toBeDefined();
          expect(config.targets.version.executor).toBe(
            '@jscutlery/semver:version'
          );
          expect(config.targets.version.options?.syncVersions).toBeUndefined();
          expect(config.targets.version.options?.baseBranch).toBeUndefined();
          expect(config.targets.version.options?.commitMessageFormat).toBe(
            'chore(${projectName}): release version ${version}'
          );
          expect(
            config.targets.version.options?.postTargets?.length
          ).toBeDefined();
          expect(config.targets.version.options?.postTargets.length).toBe(1);
          expect(config.targets.version.options?.postTargets[0]).toBe(
            'dotnetVersion'
          );
        });

        it('adds csproj to project (ownSolition false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');
          const projectNames = names(options.name);
          const projectPath = path.join(
            config.root,
            `${projectNames.className}.csproj`
          );

          expect(appTree.exists(projectPath)).toBe(true);
        });

        it('adds csproj to project (ownSolition true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');
          const projectNames = names(options.name);
          const projectPath = path.join(
            config.root,
            projectNames.className,
            `${projectNames.className}.csproj`
          );

          expect(appTree.exists(projectPath)).toBe(true);
        });

        it('adds root sln containing project to workspace (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');
          const projectNames = names(options.name);
          const slnPath = path.join(`${packageJsonName}.sln`);

          expect(appTree.exists(slnPath)).toBe(true);

          const slnProjects = readProjectsFromSolutionContent(
            appTree.read(slnPath).toString(),
            ''
          );

          expect(slnProjects).toContain(
            path.join(config.root, `${projectNames.className}.csproj`)
          );
        });

        it('adds sln to project (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: true,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');
          const projectNames = names(options.name);
          const slnPath = path.join(
            config.root,
            `${projectNames.className}.sln`
          );

          expect(appTree.exists(slnPath)).toBe(true);

          const slnProjects = readProjectsFromSolutionContent(
            appTree.read(slnPath).toString(),
            ''
          );

          expect(slnProjects).toContain(
            path.join(
              projectNames.className,
              `${projectNames.className}.csproj`
            )
          );
        });

        it('adds csproj to project with directory (ownSolition false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            directory: 'grouped',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(
            appTree,
            'grouped-my-project'
          );
          const projectNames = names(options.name);
          const projectPath = path.join(
            config.root,
            `${projectNames.className}.csproj`
          );

          expect(appTree.exists(projectPath)).toBe(true);
        });

        it('adds csproj to project with directory (ownSolition true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            directory: 'grouped',
            projectType: projectType,
            ownSolution: true,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(
            appTree,
            'grouped-my-project'
          );
          const projectNames = names(options.name);
          const projectPath = path.join(
            config.root,
            projectNames.className,
            `${projectNames.className}.csproj`
          );

          expect(appTree.exists(projectPath)).toBe(true);
        });

        it('adds root sln containing project with directory to workspace (ownSolution false)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            directory: 'grouped',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(
            appTree,
            'grouped-my-project'
          );
          const projectNames = names(options.name);
          const slnPath = path.join(`${packageJsonName}.sln`);

          expect(appTree.exists(slnPath)).toBe(true);

          const slnProjects = readProjectsFromSolutionContent(
            appTree.read(slnPath).toString(),
            ''
          );

          expect(slnProjects).toContain(
            path.join(config.root, `${projectNames.className}.csproj`)
          );
        });

        it('adds sln to project with directory (ownSolution true)', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            directory: 'grouped',
            projectType: projectType,
            ownSolution: true,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(
            appTree,
            'grouped-my-project'
          );
          const projectNames = names(options.name);
          const slnPath = path.join(
            config.root,
            `${projectNames.className}.sln`
          );

          expect(appTree.exists(slnPath)).toBe(true);

          const slnProjects = readProjectsFromSolutionContent(
            appTree.read(slnPath).toString(),
            ''
          );

          expect(slnProjects).toContain(
            path.join(
              projectNames.className,
              `${projectNames.className}.csproj`
            )
          );
        });

        it('adds package.json to project with directory', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            directory: 'grouped',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(
            appTree,
            'grouped-my-project'
          );
          const packageJsonPath = path.join(config.root, 'package.json');

          expect(appTree.exists(packageJsonPath)).toBe(true);

          const packageJsonBuffer = appTree.read(packageJsonPath);
          const packageJson = JSON.parse(packageJsonBuffer.toString());

          const dotnetPackageJsonBuffer = readFileSync(
            path.join(__dirname, '..', '..', '..', 'package.json')
          );
          const dotnetPackageJson = JSON.parse(
            dotnetPackageJsonBuffer.toString()
          );

          expect(packageJson?.name).toBe('my-project');

          expect(packageJson?.devDependencies).toBeDefined();
          expect(
            packageJson.devDependencies['@jscutlery/semver']
          ).toBeDefined();
          expect(
            packageJson.devDependencies['@nx-boat-tools/dotnet']
          ).toBeDefined();
          expect(packageJson.devDependencies['@nx-boat-tools/dotnet']).toBe(
            dotnetPackageJson.version
          );
        });

        it('adds package.json to project', async () => {
          const options: DotnetGeneratorSchema = {
            name: 'my-project',
            projectType: projectType,
            ownSolution: false,
          };

          await generator(appTree, options);

          const config = readProjectConfiguration(appTree, 'my-project');
          const packageJsonPath = path.join(config.root, 'package.json');

          expect(appTree.exists(packageJsonPath)).toBe(true);

          const packageJsonBuffer = appTree.read(packageJsonPath);
          const packageJson = JSON.parse(packageJsonBuffer.toString());

          const dotnetPackageJsonBuffer = readFileSync(
            path.join(__dirname, '..', '..', '..', 'package.json')
          );
          const dotnetPackageJson = JSON.parse(
            dotnetPackageJsonBuffer.toString()
          );

          expect(packageJson?.name).toBe('my-project');

          expect(packageJson?.devDependencies).toBeDefined();
          expect(
            packageJson.devDependencies['@jscutlery/semver']
          ).toBeDefined();
          expect(
            packageJson.devDependencies['@nx-boat-tools/dotnet']
          ).toBeDefined();
          expect(packageJson.devDependencies['@nx-boat-tools/dotnet']).toBe(
            dotnetPackageJson.version
          );
        });
      }
    );

    each([...appProjectTypes]).describe('projectType %s', (projectType) => {
      let appTree: Tree;

      beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace(2);

        console.log(
          `\nRunning Test '${expect.getState().currentTestName}'...\n`
        );
      });

      afterEach(() => {
        mockFs.restore();

        console.log(
          `\nTest '${expect.getState().currentTestName}' Complete!\n`
        );
      });

      it('adds project as Nx application', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          projectType: projectType,
          ownSolution: false,
        };

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        expect(config).toBeDefined();
        expect(config?.projectType).toBe('application');
        expect(config?.root).toBe(path.join('apps', options.name));
      });

      it('adds project as Nx application with directory', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          directory: 'grouped',
          projectType: projectType,
          ownSolution: false,
        };

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'grouped-my-project');

        expect(config).toBeDefined();
        expect(config?.projectType).toBe('application');
        expect(config?.root).toBe(
          path.join('apps', options.directory, options.name)
        );
      });

      it('adds run to project config (ownSolution false)', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          projectType: projectType,
          ownSolution: false,
        };
        const projectNames = names(options.name);

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        expect(config?.targets?.run).toBeDefined();
        expect(config.targets.run.executor).toBe('@nx-boat-tools/dotnet:run');

        expect(config.targets.build.options?.srcPath).toBe(
          `${config.root}/${projectNames.className}.csproj`
        );
        expect(config.targets.run.options?.outputPath).toBe(
          path.join('dist', config.root)
        );
        expect(config.targets.run.options?.configuration).toBe('Debug');

        expect(config.targets.run.configurations?.prod).toBeDefined();
        expect(config.targets.run.configurations?.prod?.configuration).toBe('Release');
      });

      it('adds run to project config (ownSolution true)', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          projectType: projectType,
          ownSolution: true,
        };
        const projectNames = names(options.name);

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        expect(config?.targets?.run).toBeDefined();
        expect(config.targets.run.executor).toBe('@nx-boat-tools/dotnet:run');

        expect(config.targets.build.options?.srcPath).toBe(
          `${config.root}/${projectNames.className}.sln`
        );
        expect(config.targets.run.options?.outputPath).toBe(
          path.join('dist', config.root)
        );
        expect(config.targets.run.options?.configuration).toBe('Debug');

        expect(config.targets.run.configurations?.prod).toBeDefined();
        expect(config.targets.run.configurations?.prod?.configuration).toBe('Release');
      });
    });

    each([...libProjectTypes]).describe('projectType %s', (projectType) => {
      let appTree: Tree;

      beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace(2);

        console.log(
          `\nRunning Test '${expect.getState().currentTestName}'...\n`
        );
      });

      afterEach(() => {
        mockFs.restore();

        console.log(
          `\nTest '${expect.getState().currentTestName}' Complete!\n`
        );
      });

      it('adds project as Nx library', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          projectType: projectType,
          ownSolution: false,
        };

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        expect(config).toBeDefined();
        expect(config?.projectType).toBe('library');
        expect(config?.root).toBe(path.join('libs', options.name));
      });

      it('adds project as Nx library with directory', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          directory: 'grouped',
          projectType: projectType,
          ownSolution: false,
        };

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'grouped-my-project');

        expect(config).toBeDefined();
        expect(config?.projectType).toBe('library');
        expect(config?.root).toBe(
          path.join('libs', options.directory, options.name)
        );
      });

      it('does not add run to project config', async () => {
        const options: DotnetGeneratorSchema = {
          name: 'my-project',
          projectType: projectType,
          ownSolution: false,
        };

        await generator(appTree, options);

        const config = readProjectConfiguration(appTree, 'my-project');

        expect(config?.targets?.run).toBeUndefined();
      });
    });
  });
});
