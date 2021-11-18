import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { create } from 'xmlbuilder2';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawnAsync } from '@nx-boat-tools/common';

import { DotNetCommandExecutorSchema } from './schema';
import { getAllProjectsFromSolution } from '../../utilities/slnFileHelper';

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

function getAllProjects(dotnetProjectPath: string): Array<string> {
  if (dotnetProjectPath.endsWith('.csproj')) {
    return [dotnetProjectPath];
  } else if (!dotnetProjectPath.endsWith('.sln')) {
    throw new Error(
      `The dotnet project file must have an extenstion of '.csproj' or '.sln'`
    );
  }

  const slnBuffer = readFileSync(dotnetProjectPath);

  if (slnBuffer === null) {
    throw new Error(
      `Unable to read the dotnet project file specified, '${dotnetProjectPath}'`
    );
  }

  const slnContent = slnBuffer.toString();
  const basePath = dotnetProjectPath.substring(
    0,
    dotnetProjectPath.lastIndexOf(path.sep)
  );

  return getAllProjectsFromSolution(slnContent, basePath);
}

async function updateCsprojFile(
  dotnetProjectPath: string,
  outputPath: string,
  updateVersion: boolean
): Promise<void> {
  const projPaths = getAllProjects(dotnetProjectPath);

  for (let x = 0; x < projPaths.length; x++) {
    const currentProjPath = projPaths[x];

    console.log(`📝 Updating csproj file '${currentProjPath}'...`);

    const csprojBuffer = readFileSync(currentProjPath);

    if (csprojBuffer === null) {
      throw new Error(
        `Unable to read the csproj file specified, '${currentProjPath}'`
      );
    }

    let xmlString = csprojBuffer.toString();
    let xmlDoc = create(xmlString);
    const doc: any = xmlDoc.end({ format: 'object' });

    if (_.isArray(doc.Project.PropertyGroup)) {
      doc.Project.PropertyGroup[0].IsPackable = true;
    } else {
      doc.Project.PropertyGroup.IsPackable = true;
    }

    if (updateVersion) {
      const versionPath = path.join(outputPath, 'VERSION');

      if (!existsSync(versionPath)) {
        throw new Error(
          `Unable to detect version. No VERSION file found at '${versionPath}'!`
        );
      }

      const version = readFileSync(versionPath).toString();

      console.log(`\t🏷  Updating version to ${version}...`);

      if (_.isArray(doc.Project.PropertyGroup)) {
        doc.Project.PropertyGroup[0].ReleaseVersion = version;
        doc.Project.PropertyGroup[0].PackageVersion = version;
      } else {
        doc.Project.PropertyGroup.ReleaseVersion = version;
        doc.Project.PropertyGroup.PackageVersion = version;
      }
    }

    xmlDoc = create(doc);
    xmlString = xmlDoc.end({ prettyPrint: true, headless: true });

    writeFileSync(currentProjPath, xmlString);

    console.log('');
  }
}

export default async function (
  options: DotNetCommandExecutorSchema,
  context: ExecutorContext
) {
  let { srcPath, outputPath } = options;
  const { action, configMap, runtimeID, updateVersion, additionalArgs } =
    options;
  const { root, projectName, configurationName } = context;

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
    await updateCsprojFile(srcPath, outputPath, updateVersion);
  }

  const args: Array<string> = [];

  if (action === 'run') {
    args.push(`--project ${srcPath}`);
  } else {
    args.push(`${srcPath}`);
    args.push(`--output ${outputPath}`);
  }

  const hasConfig =
    configurationName !== undefined &&
    configMap !== undefined &&
    configMap !== null;
  const config =
    (hasConfig ? configMap[configurationName] : undefined) || configurationName;

  args.push(!hasConfig ? '' : `--configuration ${config}`);
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
