import * as _ from 'underscore';
import { ExecutorContext } from '@nrwl/devkit';

import { promiseToAsyncIterator } from './iterableHelpers';

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

  const targets = createTargetConfig(args.targetsMap);

  const result = {
    root: __dirname,
    projectName: args.projectName,
    targetName: args.targetName,
    configurationName: args.configurationName,
    target: undefined,
    workspace: {
      version: 2,
      projects: {},
      npmScope: 'src',
    },
    cwd: __dirname,
    isVerbose: false,
  };

  const prefix = args.projectType == 'library' ? 'libs' : 'apps';

  result.workspace.projects[args.projectName] = {
    root: `${prefix}/${args.projectName}`,
    sourceRoot: `${prefix}/${args.projectName}/src`,
    projectType: args.projectType,
    targets: targets,
  };

  return result;
}

export function createTargetConfig(
  targetsMap?: { name: string; echo: string }[]
) {
  return targetsMap === undefined
    ? {}
    : _.object(
        _.map(targetsMap, (tm) => tm.name),
        _.map(targetsMap, (tm) => {
          return {
            executor: '@nrwl/workspace:run-commands',
            options: {
              commands: [{ command: `echo '${tm.echo}'` }],
            },
          };
        })
      );
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
