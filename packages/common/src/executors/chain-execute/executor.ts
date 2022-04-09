import * as _ from 'underscore';
import {
  ExecutorContext,
  readProjectConfiguration,
  runExecutor,
} from '@nrwl/devkit';
import { FsTree } from 'nx/src/shared/tree';

import { ChainExecutorSchema } from './schema';
import { asyncIteratorToArray } from '../../utilities/iterableHelpers';

type TargetSpecification = {
  project: string;
  target: string;
  configuration?: string;
};

const toTarget = (project: string, target: string, configuration?: string) => {
  return {
    project: project,
    target: target,
    configuration: configuration,
  } as TargetSpecification;
};

const negotiateTargetConfigurations = (
  targets: Array<TargetSpecification>,
  context: ExecutorContext
): Array<TargetSpecification> => {
  if (context.configurationName === undefined) {
    return targets;
  }

  console.log('\n🤝 Negotiating target configurations...\n')

  const tree = new FsTree(context.root, false);
  const projectConfig = readProjectConfiguration(tree, context.projectName);

  return _.map(targets, (targetSpec) => {
    const projectTarget = projectConfig.targets[targetSpec.target];

    const negotiatedConfig = _.contains(
      _.keys(projectTarget.configurations),
      context.configurationName
    )
      ? context.configurationName
      : undefined;

    return {
      ...targetSpec,
      configuration: negotiatedConfig,
    };
  });
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

  let targetsToRun = _.map(targets, (target) =>
    toTarget(projectName, target, configurationName)
  );
  targetsToRun = negotiateTargetConfigurations(targetsToRun, context);

  let stack: Promise<{ success: boolean }> = Promise.resolve({
    success: false,
  });

  _.each(targetsToRun, (target) => {
    stack = stack
      .then(async () => {
        const targetString = (target.configuration !== undefined) ? `${target.target}:${target.configuration}` : target.target;
        
        console.log(`\n⛓ Running chained target '${targetString}'...\n`);

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
