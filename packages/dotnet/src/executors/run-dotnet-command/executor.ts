import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { DotNetCommandExecutorSchema } from './schema';
import { getAllProjectsFromFile } from '../../utilities/slnFileHelper';
import { updateCsprojFile } from '../../utilities/csprojFileHelper';

const validActions: Array<string> = [
  'build',
  'pack',
  'publish',
  'run',
  'clean',
];
const actionVerbs: { [key: string]: string } = {
  build: '🔨 Building',
  pack: '📦 Packing',
  publish: '📤 Publishing',
  run: '👟 Running',
  clean: '🗑 Cleaning',
};

async function updateCsprojIsPackable(
  dotnetProjectPath: string
): Promise<void> {
  const projPaths = getAllProjectsFromFile(dotnetProjectPath);

  for (let x = 0; x < projPaths.length; x++) {
    const currentProjPath = projPaths[x];

    await updateCsprojFile(currentProjPath, (doc) => {
      if (_.isArray(doc.Project.PropertyGroup)) {
        doc.Project.PropertyGroup[0].IsPackable = true;
      } else {
        doc.Project.PropertyGroup.IsPackable = true;
      }
    });
  }
}

export async function runDotnetCommand(
  options: DotNetCommandExecutorSchema,
  context: ExecutorContext
) {
  let { srcPath, outputPath } = options;
  const { action, configuration, runtimeID, additionalArgs } = options;
  const { root, projectName } = context;

  if (projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (!_.contains(validActions, action)) {
    throw new Error('You must specify a valid action.');
  }

  if (srcPath === undefined || srcPath === '') {
    throw new Error(
      'You must specify the location of the csproj file for the project.'
    );
  }

  if (outputPath === undefined || outputPath === '') {
    throw new Error('You must specify an output path.');
  }

  srcPath = path.join(root, srcPath);
  outputPath = path.join(root, outputPath);

  if (!existsSync(srcPath)) {
    throw new Error(`Unable to locate src path, '${srcPath}'`);
  }

  if (action == 'build') {
    await updateCsprojIsPackable(srcPath);
  }

  const args: Array<string> = [];

  if (action === 'run') {
    args.push(`--project ${srcPath}`);
  } else {
    args.push(`${srcPath}`);
    args.push(`--output ${outputPath}`);
  }

  args.push(
    configuration === undefined ? '' : `--configuration ${configuration}`
  );
  args.push(runtimeID === undefined ? '' : `--runtime ${runtimeID}`);
  args.push(additionalArgs === undefined ? '' : additionalArgs);

  const argString = _.without(args, '').join(' ');

  console.log(
    `${actionVerbs[action]} .Net Project '${context.projectName}'...\n`
  );
  console.log(await spawnAsync(`dotnet ${action} ${argString}`));
  console.log(`🎉${actionVerbs[action].substring(2)} complete!`);

  return { success: true };
}

export default runDotnetCommand;
