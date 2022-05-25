import * as path from 'path';
import {
  ProjectConfiguration,
  Tree,
  addDependenciesToPackageJson,
  addProjectConfiguration,
  generateFiles,
  getWorkspaceLayout,
  names,
} from '@nrwl/devkit';
import { createTarget } from '@jscutlery/semver/src/generators/install/utils/create-target';

import testGenerator from '../test/generator';
import { DotnetTestProjectGeneratorSchema } from './schema';

interface NormalizedSchema extends DotnetTestProjectGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  projectDistPath: string;
  parsedTags: string[];
  rootDir: string;
}

interface TemplateOptions extends NormalizedSchema {
  name: string;
  className: string;
  propertyName: string;
  constantName: string;
  fileName: string;
  template: string;
}

function normalizeOptions(
  tree: Tree,
  options: DotnetTestProjectGeneratorSchema
): NormalizedSchema {
  const layout = getWorkspaceLayout(tree);

  const rootDir = tree.root;
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `apps/${projectDirectory}`;

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const projectDistPath = path.join('dist', projectRoot);

  options.isStandaloneConfig ??= layout.standaloneAsDefault;

  return {
    ...options,
    rootDir,
    projectName,
    projectRoot,
    projectDirectory,
    projectDistPath,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions: TemplateOptions = {
    ...options,
    ...names(options.name),
    template: '',
  };
  addManualProjectFiles(tree, templateOptions);
  addProjectDependencies(tree);
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

function addProjectDependencies(tree: Tree) {
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@jscutlery/semver': 'latest',
    }
  );
}

export default async function (
  tree: Tree,
  options: DotnetTestProjectGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const projectConfig: ProjectConfiguration = {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    tags: normalizedOptions.parsedTags,
    targets: {
      version: createTarget({
        syncVersions: false,
        baseBranch: undefined,
        commitMessageFormat:
          'chore(${projectName}): release version ${version}',
      }),
    },
  };
  addProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfig,
    normalizedOptions.isStandaloneConfig
  );
  addFiles(tree, normalizedOptions);
  await testGenerator(tree, {
    ...options,
    project: options.name,
  });
}
