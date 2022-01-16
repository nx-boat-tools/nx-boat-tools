import * as path from 'path';
import { Guid } from 'guid-typescript';
import {
  ProjectType,
  Tree,
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  names,
  offsetFromRoot,
} from '@nrwl/devkit';
import { createTarget } from '@jscutlery/semver/src/generators/install/utils/create-target';
import { readFileSync } from 'fs';

import { DotnetGeneratorSchema } from './schema';
import {
  appendGlobalSectionToSolution,
  appendProjectLinesToSolution,
} from '../../utilities/slnFileHelper';
import { getVersionForProject } from '@nx-boat-tools/common';

interface NormalizedSchema extends DotnetGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  projectDistPath: string;
  projectPathFromSln: string;
  nxProjectType: ProjectType;
  parsedTags: string[];
  rootDir: string;
  pkgName: string;
  dotnetPluginVersion: string;
}

interface TemplateOptions extends NormalizedSchema {
  name: string;
  className: string;
  propertyName: string;
  constantName: string;
  fileName: string;
  offsetFromRoot: string;
  projectGuid: string;
  template: string;
}

function normalizeOptions(
  tree: Tree,
  options: DotnetGeneratorSchema
): NormalizedSchema {
  const rootDir = tree.root;
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getProjectDirectoryPrefix(
    tree,
    options.projectType
  )}/${projectDirectory}`;
  const projectDistPath = path.join('dist', projectRoot);
  const projectPathFromSln = !options.ownSolution ? projectRoot + path.sep : '';
  const nxProjectType = getNxProjectType(tree, options.projectType);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const pkgBuffer = tree.read('package.json');
  const pkg = pkgBuffer === null ? {} : JSON.parse(pkgBuffer.toString());

  const pkgName = names(pkg.name).className;

  const dotnetPluginVersion = getDotnetPluginVersion();

  return {
    ...options,
    rootDir,
    projectName,
    projectRoot,
    projectDirectory,
    projectDistPath,
    projectPathFromSln,
    nxProjectType,
    parsedTags,
    pkgName,
    dotnetPluginVersion,
  };
}

function getDotnetPluginVersion(): string {
  const dotnetPackageJsonPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'package.json'
  );

  return getVersionForProject(dotnetPackageJsonPath);
}

function getNxProjectType(tree: Tree, projectType: string): ProjectType {
  switch (projectType) {
    case 'classlib':
      return 'library';
    case 'webapi':
    case 'console':
    default:
      return 'application';
  }
}

function getProjectDirectoryPrefix(tree: Tree, projectType: string) {
  switch (projectType) {
    case 'classlib':
      return getWorkspaceLayout(tree).libsDir;
    case 'webapi':
    case 'console':
    default:
      return getWorkspaceLayout(tree).appsDir;
  }
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions: TemplateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    projectGuid: Guid.create().toString(),
    template: '',
  };
  addManualProjectFiles(tree, templateOptions);
  addGeneratedProjectFiles(tree, templateOptions);
  addSolutionFiles(tree, templateOptions);
  moveSolutionFileIfNeeded(tree, templateOptions);
  addProjectDependencies(tree, templateOptions);
}

function addManualProjectFiles(tree: Tree, templateOptions: TemplateOptions) {
  const pathParts: Array<string> = [__dirname, 'files', 'manual'];

  generateFiles(
    tree,
    path.join(...pathParts),
    templateOptions.projectRoot,
    templateOptions
  );
}

function addGeneratedProjectFiles(
  tree: Tree,
  templateOptions: TemplateOptions
) {
  const pathParts: Array<string> = [
    __dirname,
    '..',
    templateOptions.projectType,
    'files',
    'generated',
    'csproj',
  ];

  if (!templateOptions.ownSolution) {
    pathParts.push('__className__');
  }

  generateFiles(
    tree,
    path.join(...pathParts),
    templateOptions.projectRoot,
    templateOptions
  );
}

function addSolutionFiles(tree: Tree, templateOptions: TemplateOptions) {
  const pathParts: Array<string> = [
    __dirname,
    '..',
    templateOptions.projectType,
    'files',
    'generated',
    `sln`,
  ];

  generateFiles(
    tree,
    path.join(...pathParts),
    templateOptions.projectRoot,
    templateOptions
  );
}

function moveSolutionFileIfNeeded(
  tree: Tree,
  templateOptions: TemplateOptions
) {
  if (templateOptions.ownSolution == true) {
    return;
  }

  const rootSlnPath = path.join('.', `${templateOptions.pkgName}.sln`);
  const projectSlnPath = path.join(
    templateOptions.projectRoot,
    `${templateOptions.className}.sln`
  );

  const projectSlnBuffer = tree.read(projectSlnPath);
  let projectSlnContent =
    projectSlnBuffer === null ? '' : projectSlnBuffer.toString();

  projectSlnContent = projectSlnContent.replace(
    `${templateOptions.className}\\${templateOptions.className}.csproj`,
    `${templateOptions.className}${path.sep}${templateOptions.className}.csproj`
  );

  projectSlnContent = projectSlnContent.replace(
    `${templateOptions.className}${path.sep}${templateOptions.className}.csproj`,
    `${templateOptions.className}.csproj`
  );

  tree.delete(projectSlnPath);

  if (!tree.exists(rootSlnPath)) {
    tree.write(rootSlnPath, projectSlnContent);

    return;
  }

  const rootSlnBuffer = tree.read(rootSlnPath);
  const rootSlnContent = rootSlnBuffer === null ? '' : rootSlnBuffer.toString();

  let result = appendProjectLinesToSolution(rootSlnContent, projectSlnContent);
  result = appendGlobalSectionToSolution(result, projectSlnContent);

  tree.delete(rootSlnPath);
  tree.write(rootSlnPath, result);
}

function addProjectDependencies(tree: Tree, templateOptions: TemplateOptions) {
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@jscutlery/semver': 'latest',
    },
    path.join(templateOptions.projectRoot, 'package.json')
  );
}

export default async function (tree: Tree, options: DotnetGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const configurations = {
    dev: {},
    prod: {},
  };
  const dotnetOptions = {
    srcPath: !normalizedOptions.ownSolution
      ? path.join('.', `${normalizedOptions.pkgName}.sln`)
      : path.join(
          normalizedOptions.projectRoot,
          `${normalizedOptions.projectName}.sln`
        ),
    outputPath: normalizedOptions.projectDistPath,
    configMap: {
      dev: 'Debug',
      prod: 'Release',
    },
  };
  const runTarget =
    normalizedOptions.projectType === 'classlib'
      ? {}
      : {
          run: {
            executor: '@nx-boat-tools/dotnet:run',
            options: {
              ...dotnetOptions,
            },
            configurations,
          },
        };
  const versionTarget = createTarget({
    syncVersions: false,
    baseBranch: undefined,
    commitMessageFormat: 'chore(${projectName}): release version ${version}',
  });
  versionTarget.options.postTargets = ['dotnetVersion'];
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: normalizedOptions.nxProjectType,
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx-boat-tools/common:chain-execute',
        options: {
          targets: ['dotnetVersion', 'buildDotnet'],
        },
        configurations: {
          dev: {},
          prod: {
            additionalTargets: ['package'],
          },
        },
      },
      buildDotnet: {
        executor: '@nx-boat-tools/dotnet:build',
        options: {
          ...dotnetOptions,
        },
        configurations,
      },
      clean: {
        executor: '@nx-boat-tools/dotnet:clean',
        options: {
          ...dotnetOptions,
        },
        configurations,
      },
      dotnetVersion: {
        executor: '@nx-boat-tools/dotnet:version',
        options: {
          srcPath: dotnetOptions.srcPath,
        },
      },
      package: {
        executor: '@nx-boat-tools/dotnet:package',
        options: {
          ...dotnetOptions,
        },
        configurations,
      },
      ...runTarget,
      version: versionTarget,
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
  installPackagesTask(
    tree,
    false,
    path.join(normalizedOptions.rootDir, normalizedOptions.projectRoot)
  );
}
