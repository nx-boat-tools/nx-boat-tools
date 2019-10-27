import * as fs from 'fs-extra';
import { Guid } from 'guid-typescript';
import path from 'path';
import _ from 'underscore';
import { Builder, Parser } from 'xml2js';

import { experimental, join, normalize, strings } from '@angular-devkit/core';
import {
    apply, applyTemplates, chain, mergeWith, move, noop, Rule, SchematicContext,
    SchematicsException, template, Tree, url
} from '@angular-devkit/schematics';
import {
    addDepsToPackageJson, formatFiles, getNpmScope, names, NxJson, offsetFromRoot, toClassName,
    updateJsonInTree, updateWorkspaceInTree
} from '@nrwl/workspace';

import dotnetSchematicPkg from '../../../package.json';

export interface DotnetOptions {
  projectType: string;
  name: string;
  pathPrefix?: string;
  directory?: string;
  tags?: string;
  simpleModuleName: boolean;
  ownSolution: boolean;
}

export interface NormalizedDotnetOptions {
  rootDir: string;
  projectType: string;
  directory?: string;
  tags?: string;
  simpleModuleName: boolean;
  ownSolution: boolean;
  name: string;
  kebobName: string;
  className: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: Array<string>;
  pkgName: string;
  pkgVersion: string;
  authors: string;
  description: string;
}

export function normalizeOptions(options: DotnetOptions, host: Tree): NormalizedDotnetOptions {
  const name = strings.classify(options.name);
  const projectDirectory = options.directory ? path.join(options.directory, name) : name;

  const rootDir = host.getDir('.').path.toString();
  const projectName = projectDirectory.replace(new RegExp(path.sep, 'g'), '-');
  const prefix = options.pathPrefix || getProjectDirectoryPrefix(options.projectType);
  const projectRoot = path.join(prefix, projectDirectory);

  const kebobName = strings.dasherize(options.simpleModuleName ? name : projectName);
  const className = strings.classify(options.simpleModuleName ? name : projectName);

  const parsedTags = options.tags ? options.tags.split(',').map(s => s.trim()) : [];

  const pkgBuffer = host.read('package.json');
  const pkg = pkgBuffer === null ? {} : JSON.parse(pkgBuffer.toString());

  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  const authors = pkg.author !== undefined ? pkg.author : 'John Doe';
  const description = pkg.description !== undefined ? pkg.description : 'Project Description goes here';

  return {
    ...options,
    rootDir,
    kebobName,
    className,
    name: projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    pkgName,
    pkgVersion,
    authors,
    description
  };
}

function getProjectDirectoryPrefix(projectType: string) {
  switch (projectType) {
    case 'classlib':
      return 'libs';
    case 'webapi':
    case 'console':
    default:
      return 'apps';
  }
}

export function createFiles(options: NormalizedDotnetOptions): Rule {
    return chain([
        createProjectFiles(options),
        createSolutionFiles(options),
        moveSolutionFileIfNeeded(options)
    ]);
}

function createProjectFiles(options: NormalizedDotnetOptions): Rule {
    const pathParts: Array<string> = ['..','..','templates',`dotnet-${options.projectType}`,'files', 'csproj'];

    if(!options.ownSolution) {
        pathParts.push('__className__');
    }

  return mergeWith(
    apply(url(path.join(...pathParts)), [
      applyTemplates({
        ...options,
        projectGuid: Guid.create().toString(),
        offsetFromRoot: offsetFromRoot(options.projectRoot)
      }),
      move(options.projectRoot)
    ])
  );
}

function createSolutionFiles(options: NormalizedDotnetOptions): Rule {
    const pathParts: Array<string> = ['..','..','templates',`dotnet-${options.projectType}`,'files', `sln`];

    const projectPathFromSln = !options.ownSolution
        ? `${options.projectRoot.replace('/','\\')}\\`
        : '';

    return mergeWith(
    apply(url(path.join(...pathParts)), [
      applyTemplates({
        ...options,
        projectPathFromSln,
        projectGuid: Guid.create().toString(),
        offsetFromRoot: offsetFromRoot(options.projectRoot)
      }),
      move(options.projectRoot)
    ])
  );
}

function moveSolutionFileIfNeeded(options: NormalizedDotnetOptions): Rule {
    if(options.ownSolution) {
        return noop();
    }

    return async (host: Tree, context: SchematicContext) => {
        const rootSlnPath = path.join(options.rootDir, `${options.pkgName}.sln`);
        const projectSlnPath = path.join(options.projectRoot, `${options.className}.sln`);

        const slnBuffer = host.read(projectSlnPath);
        const slnContent = slnBuffer === null ? '' : slnBuffer.toString();

        host.delete(projectSlnPath);

        if(!host.exists(rootSlnPath)) {
            host.create(rootSlnPath, slnContent);

            return;
        }

        const rootSlnBuffer = host.read(rootSlnPath);
        const rootSlnContent = rootSlnBuffer === null ? '' : rootSlnBuffer.toString();

        const projectLineRegex = /\nProject\(/g;

        let projectLines = slnContent.split(projectLineRegex);
        projectLines.shift();
        projectLines = _.map(projectLines, line => line.substring(0, line.lastIndexOf('EndProject\r\n')));
        projectLines = _.map(projectLines, line => `\nProject(${line}EndProject\r\n`);

        const postSolutionLinesRegex = /\s*GlobalSection\(ProjectConfigurationPlatforms\) \= postSolution\r\n/g;

        let postSolutionLines = slnContent.split(postSolutionLinesRegex);
        postSolutionLines.shift();
        postSolutionLines = _.map(postSolutionLines, line => line.substring(0, line.indexOf('EndGlobalSection\r\n')));

        const endProjectIndex = rootSlnContent.lastIndexOf('EndProject\r\n') + 12;
        const endGlobalIndex = rootSlnContent.lastIndexOf('EndGlobalSection');

        let result = rootSlnContent.substring(0, endProjectIndex);
        result = result.substring(0, result.length -2);
        result += projectLines.join();
        result += rootSlnContent.substring(endProjectIndex, endGlobalIndex);
        result = result.substring(0, result.length -2);
        result += postSolutionLines.join('\n');
        result += rootSlnContent.substring(endGlobalIndex);

        host.overwrite(rootSlnPath, result);
    };
}

export function updateCsprojFile(options: NormalizedDotnetOptions): Rule {
    return async (host: Tree, context: SchematicContext) => {
        const csprojDir = options.ownSolution
            ? path.join(options.projectRoot, options.className)
            : options.projectRoot;
        const csprojPath = path.join(csprojDir, `${options.className}.csproj`);
        const csprojBuffer = host.read(csprojPath);

        if(csprojBuffer === null) {
            throw new Error(`Unable to read the csproj file specified, '${csprojPath}'`);
        }

        const parser = new Parser();
        const csproj = await parser.parseStringPromise(csprojBuffer.toString());

        const propGroup = {
            ...csproj.Project.PropertyGroup[0],
            IsPackable: true,
            PackageId: [ options.name ],
            ReleaseVersion: [ options.pkgVersion ],
            PackageVersion: [ options.pkgVersion ],
            Authors: [ options.authors ],
            Description: [ options.description ]
        };

        csproj.Project.PropertyGroup[0] = propGroup;

        const builder = new Builder();
        const xml = builder.buildObject(csproj);

        host.overwrite(csprojPath, xml);
    };
}

export function addProject(options: NormalizedDotnetOptions): Rule {
  return updateWorkspaceInTree((json: any) => {
    const architect: { [key: string]: any } = {};

    const runner = process.argv.length > 2 && process.argv[1].endsWith(`${path.sep}nx`) ? { runner: 'nx' } : {};

    const projExtension = options.ownSolution ? 'sln' : 'csproj';

    const csprojPath = options.ownSolution
        ? path.join(options.projectRoot, options.className, `${options.className}.csproj`)
        : path.join(options.projectRoot, `${options.className}.csproj`);

    const srcPath = path.join(options.projectRoot, `${options.className}.${projExtension}`);
    const outputPath = path.join('dist', options.projectRoot);

    architect.build = {
      builder: 'common-schematics:multi-builder',
      options: {
        ...runner,
        targets: ['buildDotnet']
      },
      configurations: {
        dev: {},
        prod: {
            additionalTargets: ['package']
        }
      }
    };

    architect.buildDotnet = {
      builder: 'dotnet-schematics:build-dotnet',
      options: {
        srcPath,
        outputPath,
        selfContained: false,
        configMap: {
          dev: 'Develop',
          prod: 'Release'
        }
      },
      configurations: {
        dev: {},
        prod: {}
      }
    };

    architect.package = {
      builder: 'dotnet-schematics:package-dotnet',
      options: {
        srcPath,
        outputPath,
        configMap: {
          dev: 'Develop',
          prod: 'Release'
        }
      },
      configurations: {
        dev: {},
        prod: {}
      }
    };

    architect.clean = {
      builder: 'dotnet-schematics:clean-dotnet',
      options: {
        srcPath,
        outputPath,
        configMap: {
          dev: 'Develop',
          prod: 'Release'
        }
      },
      configurations: {
        dev: {},
        prod: {}
      }
    };

    if(options.projectType !== 'classlib') {
        architect.run = {
        builder: 'dotnet-schematics:run-dotnet',
        options: {
            csprojPath,
            outputPath,
            configMap: {
            dev: 'Develop',
            prod: 'Release'
            }
        },
        configurations: {
            dev: {},
            prod: {}
        }
        };
    }

    json.projects[options.kebobName] = {
      root: options.projectRoot,
      sourceRoot: options.projectRoot,
      projectType: options.projectType === 'classlib' ? 'library' : 'application',
      schematics: {},
      architect
    };
    return json;
  });
}

export function updateNxJson(options: NormalizedDotnetOptions): Rule {
  return updateJsonInTree<NxJson>('nx.json', (json: any) => {
    json.projects[options.kebobName] = { tags: options.parsedTags };
    return json;
  });
}

export function addDependencies(options: NormalizedDotnetOptions): Rule {
  const deps = {};
  const devDeps = {
    ...dotnetSchematicPkg.peerDependencies
  };
  return addDepsToPackageJson(deps, devDeps);
}
