import {
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import _ = require('underscore');
import * as path from 'path';
import { HelmRepoGeneratorSchema } from './schema';
import { spawnSync } from 'node:child_process';
import { getHelmAppendedBuildTargets } from '../../utilities/projectConfigHelper';

interface NormalizedSchema extends HelmRepoGeneratorSchema {
  projectConfig: any;
  projectDistPath: string;
  projectHelmPath: string;
  environmentsList: string[];
}

function normalizeOptions(
  tree: Tree,
  options: HelmRepoGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectDistPath = path.join('dist', projectConfig.root);
  const projectHelmPath = path.join(projectConfig.root, 'helm');
  const environmentsList = options.environments?.split(',') || [];

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

export default async function (tree: Tree, options: HelmRepoGeneratorSchema) {
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

  const command = `helm show values ${options.repository}/${options.chart}`;

  const values = spawnSync(command, undefined, { shell: true }).output.join(
    '\n'
  );

  _.each(options.environmentsList, (environment) => {
    const filename =
      environment === 'values' ? 'values' : `values-${environment}.yaml`;
    const valuesPath = path.join(projectConfig.root, 'helm', filename);

    tree.write(valuesPath, values);
  });
}
