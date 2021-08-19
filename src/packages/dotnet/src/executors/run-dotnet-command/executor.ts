import { ExecutorContext } from '@nrwl/devkit';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { spawnAsync } from '../../utilities/spawn';
import * as path from 'path';
import * as _ from 'underscore';
import { Builder, Parser } from 'xml2js';
import { getAllProjectsFromSolution } from '../../utilities/slnFileHelper';

import { DotNetCommandExecutorSchema } from './schema';

const validActions: Array<string> = ['build', 'pack', 'publish', 'run', 'clean'];
const actionVerbs: { [key: string]: string } = {
  build: '🔨 Building',
  pack: '📦 Packing',
  publish: '📤 Publishing',
  run: '👟 Running',
  clean: '🗑 Cleaning'
};

function getAllProjects(dotnetProjectPath: string, context: ExecutorContext): Array<string> {
  if (dotnetProjectPath.endsWith('.csproj')) {
    return [dotnetProjectPath];
  }

  const slnBuffer = readFileSync(dotnetProjectPath);

  if (slnBuffer === null) {
    throw new Error(`Unable to read the dotnet project file specified, '${dotnetProjectPath}'`);
  }

  const slnContent = slnBuffer.toString();
  const basePath = dotnetProjectPath.substring(0, dotnetProjectPath.lastIndexOf(path.sep));

  return getAllProjectsFromSolution(slnContent, basePath)
}

async function updateCsprojFile(dotnetProjectPath: string, outputPath: string, updateVersion: boolean, context: ExecutorContext): Promise<void> {
  const projPaths = getAllProjects(dotnetProjectPath, context);

  for (let x = 0; x < projPaths.length; x++) {
    const currentProjPath = projPaths[x];

    console.log(`📝 Updating csproj file '${currentProjPath}'...`);

    const csprojBuffer = readFileSync(currentProjPath);

    if (csprojBuffer === null) {
      throw new Error(`Unable to read the csproj file specified, '${currentProjPath}'`);
    }

    const parser = new Parser();
    const doc = await parser.parseStringPromise(csprojBuffer.toString());

    let propGroup = {
      ...doc.Project.PropertyGroup[0],
      IsPackable: true
    };

    if (updateVersion) {
      const versionPath = path.join(outputPath, 'VERSION');

      if (!existsSync(versionPath)) {
        console.log('no version')
        throw new Error(`Unable to detect version. No VERSION file found at '${versionPath}'!`);
      }

      const version = readFileSync(versionPath).toString();

      console.log(`\t🏷  Updating version to ${version}...`);

      propGroup = {
        ...propGroup,
        ReleaseVersion: [version],
        PackageVersion: [version]
      };
    }

    doc.Project.PropertyGroup[0] = propGroup;

    const builder = new Builder();
    const xml = builder.buildObject(doc);

    writeFileSync(currentProjPath, xml);

    console.log('');
  }
}

export default async function (options: DotNetCommandExecutorSchema, context: ExecutorContext) {

  if (context.projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (options.srcPath === undefined || options.srcPath === '') {
    throw new Error('You must specify the location of the csproj file for the project.');
  }

  if (!_.contains(validActions, options.action)) {
    throw new Error('You must specify a valid action.');
  }

  if (options.outputPath === undefined || options.outputPath === '') {
    throw new Error('You must specify an output path.');
  }

  const cliConfig = context.configurationName;

  const srcPath: string = path.join(context.root, options.srcPath);
  const outputPath: string = path.join(context.root, options.outputPath);

  if (!existsSync(srcPath)) {
    throw new Error(`Unable to locate src path, '${srcPath}'`);
  }

  if(options.action == 'build') {
    await updateCsprojFile(srcPath, outputPath, options.updateVersion, context);
  }

  const args: Array<string> = [];

  if (options.action === 'run') {
    args.push(`--project ${srcPath}`);
  } else {
    args.push(`${srcPath}`);
    args.push(`--output ${outputPath}`);
  }

  const hasConfig = cliConfig !== undefined && options.configMap !== undefined && options.configMap !== null;
  const config = (hasConfig ? options.configMap[cliConfig] : undefined) || cliConfig;

  args.push(!hasConfig ? '' : `--configuration ${config}`);
  args.push(options.runtimeID === undefined ? '' : `--runtime ${options.runtimeID}`);
  args.push(options.additionalArgs === undefined ? '' : options.additionalArgs);

  const argString = _.without(args, '').join(' ');

  console.log(`${actionVerbs[options.action]} .Net Project '${context.projectName}'...\n`);

  const output = await spawnAsync(`dotnet ${options.action} ${argString}`);

  console.log(output);

  console.log(`🎉${actionVerbs[options.action].substring(2)} complete!`)

  return { success: true }
}
