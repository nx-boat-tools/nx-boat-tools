import * as _ from 'underscore';
import { ExecutorContext } from '@nrwl/devkit';

export type TargetSummary = {
  project: string;
  target: string;
  configuration?: string;
};

export type TargetMap = {
  name: string;
  echo: string;
  configurations?: { [configurationName: string]: { echo: string } };
};

export type CreateContextArgs = {
  projectName?: string;
  projectType?: string;
  targetName?: string;
  configurationName?: string;
  targetsMap?: Array<TargetMap>;
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

export function createTargetConfig(targetsMap?: Array<TargetMap>) {
  return targetsMap === undefined
    ? {}
    : _.object(
        _.map(targetsMap, (tm) => tm.name),
        _.map(targetsMap, (tm) => {
          tm.configurations ??= {};

          const configurations = {};

          _.each(_.keys(tm.configurations), (config) => {
            configurations[config] = {
              commands: [
                { command: `echo '${tm.configurations[config].echo}'` },
              ],
            };
          });

          return {
            executor: '@nrwl/workspace:run-commands',
            options: {
              commands: [{ command: `echo '${tm.echo}'` }],
            },
            configurations: configurations,
          };
        })
      );
}

export function createFakeExecutor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    summary: TargetSummary,
    options: { [k: string]: any },
    context: ExecutorContext
  ) => {
    console.log(
      `running mocked '${summary.target}' executor for project '${summary.project}' and configuration '${summary.configuration}'`,
      { options, context }
    );

    const asyncIterable = promiseToAsyncIterator(
      Promise.resolve({ success: summary.target !== 'fail' })
    );

    return Promise.resolve(asyncIterable);
  };
}

async function* promiseToAsyncIterator<T extends { success: boolean }>(
  v: Promise<T>
): AsyncIterableIterator<T> {
  yield await v;
}
