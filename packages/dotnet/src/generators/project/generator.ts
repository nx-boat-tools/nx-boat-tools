import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  ProjectType,
} from '@nrwl/devkit';
import * as path from 'path';
import { Guid } from 'guid-typescript';
import { DotnetGeneratorSchema } from './schema';
import {
  appendGlobalSectionToSolution,
  appendProjectLinesToSolution,
} from '../../utilities/slnFileHelper';

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
  pkgVersion: string;
  authors: string;
  description: string;
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

  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  const authors = pkg.author !== undefined ? pkg.author : 'John Doe';
  const description =
    pkg.description !== undefined
      ? pkg.description
      : 'Project Description goes here';

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
    pkgVersion,
    authors,
    description,
  };
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
  addProjectFiles(tree, templateOptions);
  addSolutionFiles(tree, templateOptions);
  moveSolutionFileIfNeeded(tree, templateOptions);
}

function addProjectFiles(tree: Tree, templateOptions: TemplateOptions) {
  const pathParts: Array<string> = [
    '..',
    '..',
    '..',
    '..',
    'templates',
    `dotnet-${templateOptions.projectType}`,
    'files',
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
    '..',
    '..',
    '..',
    '..',
    'templates',
    `dotnet-${templateOptions.projectType}`,
    'files',
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

  const rootSlnPath = path.join('./', `${templateOptions.pkgName}.sln`);
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

export default async function (tree: Tree, options: DotnetGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const dotnetOptions = {
    srcPath: !normalizedOptions.ownSolution
      ? path.join('./', `${normalizedOptions.pkgName}.sln`)
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
            configurations: {
              dev: {},
              prod: {},
            },
          },
        };
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: normalizedOptions.nxProjectType,
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx-boat-tools/common:chain-execute',
        options: {
          targets: ['version', 'buildDotnet'],
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
          updateVersion: true,
        },
        configurations: {
          dev: {},
          prod: {},
        },
      },
      clean: {
        executor: '@nx-boat-tools/dotnet:clean',
        options: {
          ...dotnetOptions,
        },
        configurations: {
          dev: {},
          prod: {},
        },
      },
      package: {
        executor: '@nx-boat-tools/dotnet:package',
        options: {
          ...dotnetOptions,
        },
        configurations: {
          dev: {},
          prod: {},
        },
      },
      ...runTarget,
      version: {
        executor: '@nx-boat-tools/common:set-version',
        options: {
          projectPath: normalizedOptions.projectRoot,
          outputPath: normalizedOptions.projectDistPath,
        },
        configurations: {
          dev: {},
          prod: {},
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
