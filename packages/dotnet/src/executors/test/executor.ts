import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { copyFileSync, existsSync, rmSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { TestDotnetExecutorSchema } from './schema';
import { sync as globSync } from 'glob';

interface NormalizedOptions extends TestDotnetExecutorSchema {
  projectName: string;
  projectRoot: string;
}

function normalizeOptions(
  options: TestDotnetExecutorSchema,
  context: ExecutorContext
): NormalizedOptions {
  let { srcPath, outputPath, coveragePath, collector } = options;
  const { root, projectName } = context;

  if (projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (srcPath === undefined || srcPath === '') {
    throw new Error(
      'You must specify the location of the csproj file for the project.'
    );
  }

  if (outputPath === undefined || outputPath === '') {
    throw new Error('You must specify an output path.');
  }

  const projectRoot = context.workspace.projects[projectName].root;

  collector ??= 'XPlat Code Coverage';
  coveragePath ??= path.join('coverage', projectRoot);

  srcPath = path.join(root, srcPath);
  outputPath = path.join(root, outputPath);
  coveragePath = path.join(root, coveragePath);

  if (!existsSync(srcPath)) {
    throw new Error(`Unable to locate src path, '${srcPath}'`);
  }

  return {
    ...options,
    srcPath,
    outputPath,
    coveragePath,
    collector,
    projectName,
    projectRoot: root,
  };
}

export async function runTestCommand(options: NormalizedOptions) {
  const {
    projectName,
    srcPath,
    outputPath,
    coveragePath,
    collector,
    configuration,
    runtimeID,
    additionalArgs,
  } = options;

  const args: Array<string> = [];
  args.push(`${srcPath}`);
  args.push(`--output ${outputPath}`);
  args.push(`--results-directory ${coveragePath}`);
  args.push(`--collect "${collector}"`);
  args.push(
    configuration === undefined ? '' : `--configuration ${configuration}`
  );
  args.push(runtimeID === undefined ? '' : `--runtime ${runtimeID}`);
  args.push(additionalArgs === undefined ? '' : additionalArgs);

  const argString = _.without(args, '').join(' ');

  console.log(`🔬 Testing .Net Project '${projectName}'...\n`);
  console.log(await spawnAsync(`dotnet test ${argString}`));
}

function moveCoverageFile(options: NormalizedOptions) {
  console.log('🗜 Collapsing attachements...\n');

  const files = globSync(path.join(options.coveragePath, '**', '*'), { nodir: true });

  let dirs: Array<string> = [];

  _.each(files, file => {
    copyFileSync(file, path.join(options.coveragePath, path.basename(file)));
    dirs.push(path.dirname(file));
  });

  dirs = _.uniq(dirs);

  _.each(dirs, dir => rmSync(dir, { recursive: true, force: true }));
}

export default async function run(
  options: TestDotnetExecutorSchema,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeOptions(options, context);

  await runTestCommand(normalizedOptions);
  moveCoverageFile(normalizedOptions);

  console.log(`🎉 Testing complete!`);

  return { success: true };
}
