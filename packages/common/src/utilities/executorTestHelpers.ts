import { ExecutorContext } from '@nrwl/devkit';

import { promiseToAsyncIterator } from './iterableHelpers';

import _ = require('underscore');

export type TargetSummary = {
  project: string;
  target: string;
  configuration?: string;
};

export type CreateContextArgs = {
  projectName?: string;
  projectType?: string;
  targetName?: string;
  configurationName?: string;
  targetsMap?: { name: string; echo: string }[];
};

export function createTestExecutorContext(
  args: CreateContextArgs
): ExecutorContext {
  args.projectName = args.projectName ?? 'my-project';
  args.projectType = args.projectType ?? 'application';
  args.targetName = args.targetName ?? 'my-target';
  args.targetsMap = args.targetsMap ?? [
    { name: 'build', echo: 'Hello from build' },
  ];

  const targets = _.object(
    _.map(args.targetsMap, (tm) => tm.name),
    _.map(args.targetsMap, (tm) => {
      return {
        executor: '@nrwl/workspace:run-commands',
        options: {
          commands: [{ command: `echo '${tm.echo}'` }],
        },
      };
    })
  );

  const result = {
    root: __dirname,
    projectName: args.projectName,
    targetName: args.targetName,
    configurationName: args.configurationName,
    target: undefined,
    workspace: {
      version: 2,
      projects: {},
    },
    cwd: __dirname,
    isVerbose: false,
  };

  result.workspace.projects[args.projectName] = {
    root: `packages/${args.projectName}`,
    sourceRoot: `packages/${args.projectName}/src`,
    projectType: args.projectType,
    targets: targets,
  };

  return result;
}

export function createFakeExecutor() {
  return (summary: TargetSummary) => {
    console.log(
      `running mocked '${summary.target}' executor for project '${summary.project}' and configuration '${summary.configuration}'`
    );

    const asyncIterable = promiseToAsyncIterator(
      Promise.resolve({ success: summary.target !== 'fail' })
    );

    return Promise.resolve(asyncIterable);
  };
}
