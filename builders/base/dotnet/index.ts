import { getVersion } from 'common-schematics/utils/versionBuilder';
import * as fs from 'fs-extra';
import { spawn$ } from 'observable-spawn';
import * as path from 'path';
import { from, Observable } from 'rxjs';
import { concat, map, mergeMap, tap } from 'rxjs/operators';
import _ from 'underscore';
import { Builder, Parser } from 'xml2js';

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize, resolve } from '@angular-devkit/core';

export interface DotnetOptions {
  action: string;
  additionalArgs: string;
  srcPath: string;
  outputPath: string;
  runtimeID: string;
  selfContained: boolean;
  configMap: JsonObject;
  updateVersion: boolean;
}

const validActions: Array<string> = ['build', 'pack', 'publish', 'run'];
const actionVerbs: { [key: string]: string } = {
  build: 'Building',
  pack: 'Packing',
  publish: 'Publishing',
  run: 'Running'
};

export function runDotnetCommand$(options: DotnetOptions, context: BuilderContext): Observable<BuilderOutput> {
  if (context.target === undefined) {
    throw new Error('No target found!');
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

  const root = context.workspaceRoot;
  const projectName = context.target.project;
  const cliConfig = context.target.configuration;
  const hasConfig = cliConfig !== undefined && options.configMap !== undefined && options.configMap !== null;

  const csprojPath: string = getSystemPath(resolve(normalize(root), normalize(options.srcPath)));
  const outputPath: string = getSystemPath(resolve(normalize(root), normalize(options.outputPath)));

  if (!fs.existsSync(csprojPath)) {
    throw new Error(`Unable to locate csproj file, '${csprojPath}'`);
  }

  const args: Array<string> = [];

  if (options.action === 'run') {
    args.push(`--project ${csprojPath}`);
  } else {
    args.push(`${csprojPath}`);
    args.push(`--output ${outputPath}`);
    args.push(options.selfContained === true ? '--self-contained' : '');
  }

  const config = (options.configMap !== undefined && cliConfig !== undefined ? options.configMap[cliConfig] : undefined) || cliConfig;

  args.push(!hasConfig ? '' : `--configuration ${config}`);
  args.push(options.runtimeID === undefined ? '' : `--runtime ${options.runtimeID}`);
  args.push(options.additionalArgs === undefined ? '' : options.additionalArgs);

  const argString = _.without(args, '').join(' ');

  return from(updateCsprojFile(csprojPath, options.updateVersion, context)).pipe(
    tap(() => console.log(`${actionVerbs[options.action]} .Net Project '${projectName}'...\n`)),
    concat(spawn$(`dotnet ${options.action} ${argString}`)),
    map(() => ({ success: true } as BuilderOutput))
  );
}

async function getAllProjectsFromSolution(csprojPath: string, context: BuilderContext): Promise<Array<string>> {
  if (csprojPath.endsWith('.csproj')) {
    return [csprojPath];
  }

  const slnBuffer = await fs.readFile(csprojPath);

  if (slnBuffer === null) {
    throw new Error(`Unable to read the solution file specified, '${csprojPath}'`);
  }

  const basePath = csprojPath.substring(0, csprojPath.indexOf(path.basename(csprojPath)));

  const slnContent = slnBuffer.toString();
  const projectLineRegex = /\nProject\(/g;
  const projLinePathRegex = /\"(.*)\".*\"(.*)\".*\"(.*)\"/g;

  let projectLines = slnContent.split(projectLineRegex);
  projectLines.shift();
  projectLines = _.map(projectLines, line => {
    const match = projLinePathRegex.exec(line);

    return match === null ? '' : match[2];
  });
  projectLines = _.without(projectLines, '');
  projectLines = _.map(projectLines, line => getSystemPath(resolve(normalize(basePath), normalize(line))));

  return projectLines;
}

async function updateCsprojFile(csprojPath: string, updateVersion: boolean, context: BuilderContext): Promise<void> {
  const projPaths = await getAllProjectsFromSolution(csprojPath, context);

  for (let x=0; x<projPaths.length; x++) {
    const currentProjPath = projPaths[x];

    console.log(`Updating csproj file '${currentProjPath}'...`);

    const csprojBuffer = await fs.readFile(currentProjPath);

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
      const projPath = currentProjPath.substring(0, currentProjPath.lastIndexOf(path.basename(currentProjPath)));
      const version = getVersion(context.workspaceRoot, projPath);

      console.log(`Updating version to ${version} for csproj file '${currentProjPath}'...`);

      propGroup = {
        ...propGroup,
        ReleaseVersion: [version],
        PackageVersion: [version]
      };
    }

    doc.Project.PropertyGroup[0] = propGroup;

    const builder = new Builder();
    const xml = builder.buildObject(doc);

    await fs.writeFile(currentProjPath, xml);
  }
}
