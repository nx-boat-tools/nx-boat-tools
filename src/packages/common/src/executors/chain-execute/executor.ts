import { ExecutorContext, parseTargetString, runExecutor } from '@nrwl/devkit';
import * as _ from 'underscore';

import { BuildExecutorSchema } from './schema';

export default async function (options: BuildExecutorSchema, context: ExecutorContext) {

  if (context.projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (options.additionalTargets !== undefined) {
    options.targets = options.targets.concat(options.additionalTargets);
  }

  const targets = _.map(options.targets, target => {
    return {
      project: context.projectName,
      target: target,
      configuration: context.configurationName
    };
  });

  let stack: Promise<{ success: boolean }> = Promise.resolve({ success: false });

  _.each(targets, target => {
    stack = stack
      .then(async () => {
        console.log(`\n⛓ Running chained target '${target.target}'...\n`);

        const asyncResults = await runExecutor(target, { verbose: true }, context);
        const results = await asyncIteratorToArray(asyncResults)

        const success = _.all(results, r => r.success === true);

        if (!success) throw new Error('Executor failed');

        return { success: true };
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
  );

  return stack;
}

async function asyncIteratorToArray<T>(asyncIterator: AsyncIterableIterator<T>): Promise<Array<T>> {
  const results: Array<T> = [];

  for await (const i of asyncIterator) results.push(i);

  return results;
}
