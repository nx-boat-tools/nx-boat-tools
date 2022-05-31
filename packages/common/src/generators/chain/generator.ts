import * as _ from 'underscore';
import {
  ProjectConfiguration,
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { CommonChainGeneratorSchema } from './schema';
import { appendToChainTargets } from '../../utilities/chainTargetHelpers';

interface NormalizedSchema extends CommonChainGeneratorSchema {
  projectConfig: ProjectConfiguration;
  targetsList: string[];
  preTargetsList: string[];
  postTargetsList: string[];
}

function normalizeOptions(
  tree: Tree,
  options: CommonChainGeneratorSchema
): NormalizedSchema {
  const { project, targets, preTargets, postTargets } = options;
  const projectConfig = readProjectConfiguration(tree, project);

  const targetsList = targets?.split(',') || [];
  const preTargetsList = preTargets?.split(',') || [];
  const postTargetsList = postTargets?.split(',') || [];

  return {
    ...options,
    projectConfig,
    targetsList,
    preTargetsList,
    postTargetsList,
  };
}

export default async function (
  tree: Tree,
  options: CommonChainGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  const { name, targetsList, preTargetsList, postTargetsList } =
    normalizedOptions;

  const targets = {
    ...appendToChainTargets(normalizedOptions.projectConfig.targets, {
      [name]: {
        preTargetsToAdd: preTargetsList,
        targetsToAdd: targetsList,
        postTargetsToAdd: postTargetsList,
      },
    }),
  };

  const sortetTargetKeys = _.keys(targets).sort();

  updateProjectConfiguration(tree, options.project, {
    ...normalizedOptions.projectConfig,
    targets: _.object(
      sortetTargetKeys,
      sortetTargetKeys.map((key) => targets[key])
    ),
  });
}
