import * as _ from 'underscore';
import { TargetConfiguration } from '@nrwl/devkit';

import { NamedChainExecutorStages } from '../executors/chain-execute/schema';

export interface AppendToBuildTargetAdditions {
  preTargetsToAdd?: Array<string>;
  targetsToAdd?: Array<string>;
  postTargetsToAdd?: Array<string>;
  stagesToAdd?: NamedChainExecutorStages;
}

export function appendToChainTargets(
  projectTargets: { [targetName: string]: TargetConfiguration },
  additions: { [targetName: string]: AppendToBuildTargetAdditions }
): { [targetName: string]: TargetConfiguration } {
  _.each(_.pairs(additions), (addition) => {
    const target = addition[0];
    const targetSrc = `${target}Src`;

    const { stagesToAdd } = addition[1];
    let { preTargetsToAdd, targetsToAdd, postTargetsToAdd } = addition[1];

    preTargetsToAdd = preTargetsToAdd || [];
    targetsToAdd = targetsToAdd || [];
    postTargetsToAdd = postTargetsToAdd || [];

    if (
      projectTargets[target]?.executor !== '@nx-boat-tools/common:chain-execute'
    ) {
      if (projectTargets[target] !== undefined) {
        projectTargets[targetSrc] = projectTargets[target];

        targetsToAdd.unshift(targetSrc);
      }

      projectTargets[target] = {
        executor: '@nx-boat-tools/common:chain-execute',
        options: {},
      };
    }

    if (_.some(preTargetsToAdd)) {
      projectTargets[target].options.preTargets =
        projectTargets[target].options.preTargets || [];

      projectTargets[target].options.preTargets =
        projectTargets[target].options.preTargets.concat(preTargetsToAdd);
    }

    if (_.some(targetsToAdd)) {
      projectTargets[target].options.targets =
        projectTargets[target].options.targets || [];

      projectTargets[target].options.targets =
        projectTargets[target].options.targets.concat(targetsToAdd);
    }

    if (_.some(postTargetsToAdd)) {
      projectTargets[target].options.postTargets =
        projectTargets[target].options.postTargets || [];

      projectTargets[target].options.postTargets =
        projectTargets[target].options.postTargets.concat(postTargetsToAdd);
    }

    if (stagesToAdd !== undefined && _.keys(stagesToAdd)?.length > 0) {
      projectTargets[target].options.stages =
        projectTargets[target].options.stages || {};

      _.each(_.keys(stagesToAdd), (stage) => {
        const stageToAdd = stagesToAdd[stage];

        projectTargets[target].options.stages[stage] =
          projectTargets[target].options.stages[stage] || {};

        if (_.some(stageToAdd.preTargets)) {
          projectTargets[target].options.stages[stage].preTargets =
            projectTargets[target].options.stages[stage].preTargets || [];

          projectTargets[target].options.stages[stage].preTargets =
            projectTargets[target].options.stages[stage].preTargets.concat(
              stageToAdd.preTargets
            );
        }

        if (_.some(stageToAdd.targets)) {
          projectTargets[target].options.stages[stage].targets =
            projectTargets[target].options.stages[stage].targets || [];

          projectTargets[target].options.stages[stage].targets = projectTargets[
            target
          ].options.stages[stage].targets.concat(stageToAdd.targets);
        }

        if (_.some(stageToAdd.postTargets)) {
          projectTargets[target].options.stages[stage].postTargets =
            projectTargets[target].options.stages[stage].postTargets || [];

          projectTargets[target].options.stages[stage].postTargets =
            projectTargets[target].options.stages[stage].postTargets.concat(
              stageToAdd.postTargets
            );
        }
      });
    }
  });

  return projectTargets;
}
