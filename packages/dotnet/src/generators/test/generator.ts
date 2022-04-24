import * as _ from 'underscore';
import * as path from 'path';
import {
  ProjectConfiguration,
  Tree,
  generateFiles,
  names,
  readProjectConfiguration,
  updateProjectConfiguration,
  formatFiles,
} from '@nrwl/devkit';

import { DotnetTestGeneratorSchema } from './schema';
import { appendToChainTargets } from '@nx-boat-tools/common';
import { appendGlobalSectionToSolution, appendProjectLinesToSolution } from '../../utilities/slnFileHelper';
import { Guid } from 'guid-typescript';

interface NormalizedSchema extends DotnetTestGeneratorSchema {
  pathSep: string;
  className: string;
  projectConfig: ProjectConfiguration;
  projectDistPath: string;
  projectTestDir: string;
  solutionPath: string;
  projectPathFromSln: string;
  projectGuid: string;
  testTarget: string;
}

function normalizeOptions(
  tree: Tree,
  options: DotnetTestGeneratorSchema
): NormalizedSchema {
  let { testPrefix } = options;
  const { project } = options;

  const projectConfig = readProjectConfiguration(tree, project);
  const { root } = projectConfig;

  testPrefix = (testPrefix === undefined) ? '' : names(testPrefix).className;

  const testSuffix = (testPrefix === '') ? 'Src' : testPrefix;
  const testTarget = `test${testSuffix}`;

  if (projectConfig.targets[testTarget]) {
    throw new Error(`${project} already has a ${testTarget} target.`);
  }

  const projectClassName = names(project).className;
  const className = `${projectClassName}.${testPrefix}Tests`;

  const projectDistPath = path.join('dist', root);
  const projectTestDir = path.join(root, 'tests');

  const solutionPath = getSlnPath(tree, options.project, projectConfig);
  const solutionPathDir = path.dirname(solutionPath);

  const isOwnSolution = root === solutionPathDir;

  const projectPathFromSln = !isOwnSolution ? `${projectTestDir}${path.sep}` : `tests${path.sep}`;
  const projectGuid = Guid.create().toString();

  const pathSep = path.sep;

  options.frameworkVersion ??= 'LTS';

  return {
    ...options,
    className,
    projectConfig,
    projectDistPath,
    projectTestDir,
    solutionPath,
    projectPathFromSln,
    projectGuid,
    pathSep,
    testPrefix,
    testTarget
  };
}

function getSlnPath(tree: Tree, projectName: string, projectConfig: ProjectConfiguration): string {

  const projectClassName = names(projectName).className;
  const projectSlnPath = path.join(projectConfig.root, `${projectClassName}.sln`);

  if(tree.exists(projectSlnPath)) {
    return projectSlnPath;
  }

  const pkgBuffer = tree.read('package.json');
  const pkg = pkgBuffer === null ? {} : JSON.parse(pkgBuffer.toString());

  const pkgClassName = names(pkg.name).className;
  const rootSlnPath = path.join('.', `${pkgClassName}.sln`);

  if(tree.exists(rootSlnPath)) {
    return rootSlnPath;
  }

  throw new Error(`Unable to find the solution file for project '${projectName}'`);
}

function addProjectFiles(tree: Tree, options: NormalizedSchema) {
  const pathParts: Array<string> = [
    __dirname,
    '..',
    'test',
    'files',
    'generated',
    options.testType,
    options.frameworkVersion,
    'csproj',
  ];

  generateFiles(
    tree,
    path.resolve(path.join(...pathParts)),
    options.projectTestDir,
    options
  );
}

function addTempSolutionFiles(tree: Tree, options: NormalizedSchema) {
  const pathParts: Array<string> = [
    __dirname,
    '..',
    'test',
    'files',
    'generated',
    options.testType,
    options.frameworkVersion,
    `sln`,
  ];

  generateFiles(
    tree,
    path.join(...pathParts),
    path.join('tmp', options.className),
    options
  );
}

function removeTempSolutionFiles(tree: Tree, options: NormalizedSchema) {
  const tempPath = path.join('tmp', options.className);

  tree.delete(tempPath);
}

function appendProjectToSolution(tree: Tree, options: NormalizedSchema) {
  const {solutionPath, className} = options;

  const rootSlnBuffer = tree.read(solutionPath);
  const rootSlnContent = rootSlnBuffer === null ? '' : rootSlnBuffer.toString();

  const projectSlnPath = path.join('tmp', className, `${className}.sln`);
  const projectSlnBuffer = tree.read(projectSlnPath);
  const projectSlnContent = projectSlnBuffer === null ? '' : projectSlnBuffer.toString();

  let result = appendProjectLinesToSolution(rootSlnContent, projectSlnContent);
  result = appendGlobalSectionToSolution(result, projectSlnContent);

  tree.delete(solutionPath);
  tree.write(solutionPath, result);
}

export default async function (
  tree: Tree,
  options: DotnetTestGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  const { testTarget } = normalizedOptions;

  const targets = normalizedOptions.projectConfig.targets;
  const updatedTargets = {
    ...appendToChainTargets(targets, {
      test: {
        targetsToAdd: [testTarget]
      }
    }),
    [testTarget]: {
      executor: '@nx-boat-tools/dotnet:test',
      options: {
        srcPath: path.join(
          normalizedOptions.projectTestDir,
          normalizedOptions.className,
          `${normalizedOptions.className}.csproj`
        ),
        outputPath: normalizedOptions.projectDistPath,
        configuration: 'Debug',
      },
      configurations: {
        prod: {
          configuration: 'Release',
        },
      }
    },
  };

  const sortetTargetKeys = _.keys(updatedTargets).sort();

  updateProjectConfiguration(tree, options.project, {
    ...normalizedOptions.projectConfig,
    targets: _.object(
      sortetTargetKeys,
      sortetTargetKeys.map((key) => updatedTargets[key])
    ),
  });
  addProjectFiles(tree, normalizedOptions);
  addTempSolutionFiles(tree, normalizedOptions);
  appendProjectToSolution(tree, normalizedOptions);
  removeTempSolutionFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
