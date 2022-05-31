import * as _ from 'underscore';
import {
  ProjectConfiguration,
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { ChainExecutorStage } from '../../executors/chain-execute/schema';
import { CommonChainStageGeneratorSchema } from './schema';
import { appendToChainTargets } from '../../utilities/chainTargetHelpers';

interface NormalizedSchema extends CommonChainStageGeneratorSchema {
  projectConfig: ProjectConfiguration;
  targetsList: string[];
  preTargetsList: string[];
  postTargetsList: string[];
}

function normalizeOptions(
  tree: Tree,
  options: CommonChainStageGeneratorSchema
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
  options: CommonChainStageGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  const { name, chainTarget, targetsList, preTargetsList, postTargetsList } =
    normalizedOptions;

  const targets = {
    ...appendToChainTargets(normalizedOptions.projectConfig.targets, {
      [chainTarget]: {
        stagesToAdd: {
          [name]: {
            preTargets: preTargetsList,
            targets: targetsList,
            postTargets: postTargetsList,
          } as ChainExecutorStage,
        },
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
