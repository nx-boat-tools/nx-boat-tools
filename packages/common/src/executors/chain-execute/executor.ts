import * as _ from 'underscore';
import { ExecutorContext, runExecutor } from '@nrwl/devkit';

import { ChainExecutorSchema } from './schema';
import { asyncIteratorToArray } from '../../utilities/iterableHelpers';

const toTarget = (project: string, target: string, configuration?: string) => {
  return {
    project: project,
    target: target,
    configuration: configuration,
  };
};

export default async function (
  options: ChainExecutorSchema,
  context: ExecutorContext
) {
  let { additionalTargets, run, stages, targets } = options;
  const { projectName, configurationName } = context;

  targets = targets || [];
  additionalTargets = additionalTargets || [];

  if (projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (stages !== undefined) {
    const explicitStages = run || [];
    run = run || _.keys(stages);

    let stagesToRun = _.intersection(_.keys(stages), run);
    stagesToRun = _.filter(
      stagesToRun,
      (stage) =>
        _.contains(explicitStages, stage) || stages[stage].explicit !== true
    );

    console.log(
      `\n💡 Limiting chain execute to stages ${['root', ...stagesToRun].join(
        ','
      )}...\n`
    );

    stages = _.pick(stages, ...stagesToRun);

    _.each(_.values(stages), (stage) => {
      if (stage.targets !== undefined) {
        targets = targets.concat(stage.targets);
      }

      if (stage.additionalTargets !== undefined) {
        additionalTargets = additionalTargets.concat(stage.additionalTargets);
      }
    });
  }

  if (additionalTargets !== undefined) {
    targets = targets.concat(_.uniq(additionalTargets));
  }

  const targetsToRun = _.map(targets, (target) =>
    toTarget(projectName, target, configurationName)
  );

  let stack: Promise<{ success: boolean }> = Promise.resolve({
    success: false,
  });

  _.each(targetsToRun, (target) => {
    stack = stack
      .then(async () => {
        console.log(`\n⛓ Running chained target '${target.target}'...\n`);

        const asyncResults = await runExecutor(
          target,
          { verbose: context.isVerbose },
          context
        );
        const results = await asyncIteratorToArray(asyncResults);

        const success = _.all(results, (r) => r.success === true);

        if (!success) throw new Error('Executor failed');

        return { success: true };
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  });

  return stack;
}
