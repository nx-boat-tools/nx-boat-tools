import * as path from 'path';
import { ExecutorContext, readJsonFile } from '@nrwl/devkit';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import { SetVersionExecutorSchema } from './schema';

function getRootVersion(rootDir = '.'): string | undefined {
  const pkgPath: string = path.join(rootDir, 'package.json');

  if (!existsSync(pkgPath)) {
    return undefined;
  }

  const pkg = readJsonFile(pkgPath);
  const version = pkg.version;

  console.log(`\t🔍 Root version found: '${version}'`);

  return version;
}

function getProjectVersion(projectDir: string): string | undefined {
  const versionPath: string = path.join(projectDir, 'VERSION');

  if (!existsSync(versionPath)) {
    return undefined;
  }

  const versionBuffer = readFileSync(versionPath);
  const version = versionBuffer.toString();

  console.log(`\t🔍 Project version found: '${version}'`);

  return version;
}

function appendBuildVersion(version: string) {
  console.log(
    `\t🔨 Creating a new build segment for base version ${version}...`
  );

  const today = new Date();
  const versionSegments = version.split('.').length;

  let versionSuffix = '';

  if (versionSegments < 4) {
    const iso = today.toISOString();

    versionSuffix = iso.substring(0, iso.indexOf('T'));
    versionSuffix = versionSuffix.split('-').join('');
    versionSuffix = `.${versionSuffix}`;
  }

  if (versionSegments < 3) {
    versionSuffix += '.';
    versionSuffix += today.getHours() * 60 + today.getMinutes();
  }

  return `${version}${versionSuffix}`;
}

export default async function (
  options: SetVersionExecutorSchema,
  context: ExecutorContext
) {
  if (context.projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  const outputPath: string = path.join(context.root, options.outputPath);
  const outputFile: string = path.join(outputPath, 'VERSION');

  console.log(
    `🔨 Creating build version for project '${context.projectName}'...`
  );

  let version: string | undefined = getRootVersion(context.root);

  if (options.projectPath !== undefined && options.projectPath !== '') {
    const projectVersion = getProjectVersion(options.projectPath);

    version = projectVersion || version;
  }

  version = appendBuildVersion(version || '');

  console.log(`\t🏷  Build version detected to be '${version}'.`);
  console.log(`\n💾 Saving VERSION file for build at ${outputPath}...`);

  mkdirSync(outputPath, { recursive: true });
  writeFileSync(outputFile, version);
  return { success: true };
}
