import * as _ from 'underscore';
import * as path from 'path';
import {
  NxJsonProjectConfiguration,
  ProjectConfiguration,
  Tree,
  generateFiles,
  names,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { HelmLocalGeneratorSchema } from './schema';
import { getHelmAppendedBuildTargets } from '../../utilities/projectConfigHelper';

interface NormalizedSchema extends HelmLocalGeneratorSchema {
  projectConfig: ProjectConfiguration & NxJsonProjectConfiguration;
  projectDistPath: string;
  projectHelmPath: string;
  environmentsList: string[];
}

function normalizeOptions(
  tree: Tree,
  options: HelmLocalGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectDistPath = path.join('dist', projectConfig.root);
  const projectHelmPath = path.join(projectConfig.root, 'helm');
  const environmentsList = options.environments?.split(',') || [];

  if (projectConfig.targets.copyHelmValues) {
    throw new Error(`${options.project} already has a copyHelmValues target.`);
  }

  if (environmentsList.length == 0) {
    environmentsList.push('values');
  }

  return {
    ...options,
    projectConfig,
    projectDistPath,
    projectHelmPath,
    environmentsList,
  };
}

export default async function (tree: Tree, options: HelmLocalGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const updatedTargets = getHelmAppendedBuildTargets(
    normalizedOptions.projectDistPath,
    normalizedOptions.projectHelmPath,
    normalizedOptions.projectConfig,
    true
  );

  updateProjectConfiguration(tree, options.project, {
    ...normalizedOptions.projectConfig,
    targets: updatedTargets,
  });
  addChartFiles(tree, normalizedOptions);
  copyValuesFiles(tree, normalizedOptions);
  //await formatFiles(tree);
}

function addChartFiles(tree: Tree, options: NormalizedSchema) {
  const pathParts: Array<string> = [__dirname, 'files', 'generated'];
  const templateOptions = {
    ...options,
    ...names(options.project),
    dot: '.',
    template: '',
  };
  generateFiles(
    tree,
    path.resolve(path.join(...pathParts)),
    path.join(options.projectConfig.root, 'helm', 'chart'),
    templateOptions
  );
}

function copyValuesFiles(tree: Tree, options: NormalizedSchema) {
  if (options.createValues != true) return;

  const projectConfig = options.projectConfig;
  const chartValuesFile = path.join(
    options.projectHelmPath,
    'chart',
    'values.yaml'
  );

  const values = tree.read(chartValuesFile).toString();

  _.each(options.environmentsList, (environment) => {
    const filename =
      environment === 'values' ? 'values.yaml' : `values-${environment}.yaml`;
    const valuesPath = path.join(projectConfig.root, 'helm', filename);

    tree.write(valuesPath, values);
  });
}
