import * as _ from 'underscore';
import * as path from 'path';
import {
  ProjectConfiguration,
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { spawnSync } from 'node:child_process';

import { HelmRepoChartGeneratorSchema } from './schema';
import { getHelmAppendedBuildTargets } from '../../utilities/projectConfigHelper';

interface NormalizedSchema extends HelmRepoChartGeneratorSchema {
  projectConfig: ProjectConfiguration;
  projectDistPath: string;
  projectHelmPath: string;
  environmentsList: string[];
}

function normalizeOptions(
  tree: Tree,
  options: HelmRepoChartGeneratorSchema
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

export default async function (
  tree: Tree,
  options: HelmRepoChartGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const updatedTargets = getHelmAppendedBuildTargets(
    normalizedOptions.projectDistPath,
    normalizedOptions.projectHelmPath,
    normalizedOptions.projectConfig
  );

  updateProjectConfiguration(tree, options.project, {
    ...normalizedOptions.projectConfig,
    targets: updatedTargets,
  });
  createValuesFiles(tree, normalizedOptions);
}

function createValuesFiles(tree: Tree, options: NormalizedSchema) {
  console.log(`Fetching values for ${options.repository}/${options.chart}...`);

  const projectConfig = options.projectConfig;

  const args = ['show', 'values', `${options.repository}/${options.chart}`];

  const values = spawnSync('helm', args, { shell: true }).output.join('\n');

  _.each(options.environmentsList, (environment) => {
    const filename =
      environment === 'values' ? 'values.yaml' : `values-${environment}.yaml`;
    const valuesPath = path.join(projectConfig.root, 'helm', filename);

    tree.write(valuesPath, values);
  });
}
