import * as _ from 'underscore';
import * as path from 'path';
import {
  ProjectConfiguration,
  Tree,
  generateFiles,
  names,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { HelmLocalChartGeneratorSchema } from './schema';
import { getHelmAppendedBuildTargets } from '../../utilities/projectConfigHelper';

interface NormalizedSchema extends HelmLocalChartGeneratorSchema {
  projectConfig: ProjectConfiguration;
  projectDistPath: string;
  projectHelmPath: string;
  environmentsList: string[];
  valuesFilesPaths: string[];
}

function normalizeOptions(
  tree: Tree,
  options: HelmLocalChartGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectDistPath = path.join('dist', projectConfig.root);
  const projectHelmPath = path.join(projectConfig.root, 'helm');
  const environmentsList = options.environments?.split(',') || [];

  if (projectConfig.targets.copyHelmValues) {
    throw new Error(`${options.project} already has a copyHelmValues target.`);
  }

  if (!_.contains(environmentsList, 'values')) {
    environmentsList.push('values');
  }

  const valuesFilesPaths = _.map(environmentsList, (environment: string) => {
    const filename =
      environment === 'values' ? 'values.yaml' : `values-${environment}.yaml`;
    const valuesPath = path.join(projectConfig.root, 'helm', filename);

    return valuesPath;
  });

  return {
    ...options,
    projectConfig,
    projectDistPath,
    projectHelmPath,
    environmentsList,
    valuesFilesPaths,
  };
}

export default async function (
  tree: Tree,
  options: HelmLocalChartGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const updatedTargets = getHelmAppendedBuildTargets(
    normalizedOptions.projectConfig.targets,
    options.project,
    {
      projectDistPath: normalizedOptions.projectDistPath,
      projectHelmPath: normalizedOptions.projectHelmPath,
      runBuildTarget: normalizedOptions.runBuildTarget,
      runValuesPaths: [
        path.join(normalizedOptions.projectConfig.root, 'helm', 'values.yaml'),
      ],
      runResourceName: normalizedOptions.runResourceName,
      runHostPort: normalizedOptions.runHostPort,
      runContainerPort: normalizedOptions.runContainerPort,
    },
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

  const chartValuesFile = path.join(
    options.projectHelmPath,
    'chart',
    'values.yaml'
  );

  const values = tree.read(chartValuesFile).toString();

  _.each(options.valuesFilesPaths, (valuesPath) => {
    tree.write(valuesPath, values);
  });
}
