import * as path from 'path';
import { Guid } from 'guid-typescript';
import {
  ProjectConfiguration,
  ProjectType,
  Tree,
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  names,
} from '@nrwl/devkit';
import { createTarget } from '@jscutlery/semver/src/generators/install/utils/create-target';
import { getVersionForProject } from '@nx-boat-tools/common';

import { DotnetGeneratorSchema } from './schema';
import {
  appendGlobalSectionToSolution,
  appendProjectLinesToSolution,
} from '../../utilities/slnFileHelper';

interface NormalizedSchema extends DotnetGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  projectSrcPath: string;
  projectDistPath: string;
  projectPathFromSln: string;
  nxProjectType: ProjectType;
  parsedTags: string[];
  rootDir: string;
  pkgName: string;
  dotnetPluginVersion: string;
  projectClassName: string;
}

interface TemplateOptions extends NormalizedSchema {
  name: string;
  className: string;
  propertyName: string;
  constantName: string;
  fileName: string;
  pathSep: string;
  projectGuid: string;
}

function normalizeOptions(
  tree: Tree,
  options: DotnetGeneratorSchema
): NormalizedSchema {
  const layout = getWorkspaceLayout(tree);

  const rootDir = tree.root;
  const { fileName, className } = names(options.name);
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${fileName}`
    : fileName;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getProjectDirectoryPrefix(
    options.projectType,
    layout
  )}/${projectDirectory}`;
  const projectSrcPath = path.join(projectRoot, 'src');
  const projectDistPath = path.join('dist', projectRoot);
  const projectPathFromSln = !options.ownSolution ? `${projectSrcPath}${path.sep}` : `src${path.sep}`;
  const nxProjectType = getNxProjectType(tree, options.projectType);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const pkgBuffer = tree.read('package.json');
  const pkg = pkgBuffer === null ? {} : JSON.parse(pkgBuffer.toString());

  const pkgName = names(pkg.name).className;

  const dotnetPluginVersion = getDotnetPluginVersion();

  options.standaloneConfig ??= layout.standaloneAsDefault;
  options.frameworkVersion ??= 'LTS';

  return {
    ...options,
    rootDir,
    projectName,
    projectRoot,
    projectDirectory,
    projectSrcPath,
    projectDistPath,
    projectPathFromSln,
    nxProjectType,
    parsedTags,
    pkgName,
    dotnetPluginVersion,
    projectClassName: className,
  };
}

function getDotnetPluginVersion(): string {
  const dotnetPackageJsonPath = path.join(__dirname, '..', '..', '..');

  return getVersionForProject(dotnetPackageJsonPath);
}

function getNxProjectType(tree: Tree, projectType: string): ProjectType {
  switch (projectType) {
    case 'classlib':
      return 'library';
    case 'console':
    case 'grpc':
    case 'webapi':
    default:
      return 'application';
  }
}

function getProjectDirectoryPrefix(
  projectType: string,
  workspaceLayout: { libsDir: string; appsDir: string }
) {
  switch (projectType) {
    case 'classlib':
      return workspaceLayout.libsDir;
    case 'console':
    case 'grpc':
    case 'webapi':
    default:
      return workspaceLayout.appsDir;
  }
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions: TemplateOptions = {
    ...options,
    ...names(options.name),
    pathSep: path.sep,
    projectGuid: Guid.create().toString(),
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
    templateOptions.frameworkVersion,
    'csproj',
  ];

  if (!templateOptions.ownSolution) {
    pathParts.push('__className__');
  }

  generateFiles(
    tree,
    path.join(...pathParts),
    templateOptions.projectSrcPath,
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
    templateOptions.frameworkVersion,
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
    prod: {
      configuration: 'Release',
    },
  };
  const dotnetOptions = {
    srcPath: !normalizedOptions.ownSolution
      ? path.join(
          normalizedOptions.projectSrcPath,
          `${normalizedOptions.projectClassName}.csproj`
        )
      : path.join(
          normalizedOptions.projectRoot,
          `${normalizedOptions.projectClassName}.sln`
        ),
    outputPath: normalizedOptions.projectDistPath,
    configuration: 'Debug',
  };
  const runTarget =
    normalizedOptions.projectType === 'classlib'
      ? {}
      : {
          runSrc: {
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
  const projectConfig: ProjectConfiguration = {
    root: normalizedOptions.projectRoot,
    projectType: normalizedOptions.nxProjectType,
    sourceRoot: normalizedOptions.projectSrcPath,
    targets: {
      build: {
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
  };
  addProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfig,
    normalizedOptions.standaloneConfig
  );
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
  installPackagesTask(
    tree,
    false,
    path.join(normalizedOptions.rootDir, normalizedOptions.projectRoot)
  );
}
