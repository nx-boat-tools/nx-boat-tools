import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync, readFileSync } from 'fs';

import { DotNetVersionExecutorSchema } from './schema';
import { getAllProjectsFromFile } from '../../utilities/slnFileHelper';
import { updateCsprojFile } from '../../utilities/csprojFileHelper';

function getVersionForProject(projectPath: string): string {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      `Unable to detect version. No package.json found at '${packageJsonPath}'!`
    );
  }

  const projectPackageJsonBuffer = readFileSync(packageJsonPath);
  const projectPackageJsonString = projectPackageJsonBuffer.toString();
  const projectPackageJson = JSON.parse(projectPackageJsonString);

  const version = projectPackageJson?.version || '0.0.0';

  return version;
}

async function updateCsprojVersion(
  dotnetProjectPath: string,
  version: string
): Promise<void> {
  await updateCsprojFile(dotnetProjectPath, (doc) => {
    console.log(`\t🏷  Updating version to ${version}...`);

    if (_.isArray(doc.Project.PropertyGroup)) {
      doc.Project.PropertyGroup[0].ReleaseVersion = version;
      doc.Project.PropertyGroup[0].PackageVersion = version;
    } else {
      doc.Project.PropertyGroup.ReleaseVersion = version;
      doc.Project.PropertyGroup.PackageVersion = version;
    }
  });
}

export default async function (
  options: DotNetVersionExecutorSchema,
  context: ExecutorContext
) {
  let { srcPath } = options;
  const { root, projectName } = context;

  if (projectName === undefined) {
    throw new Error('You must specify a project!');
  }

  if (srcPath === undefined || srcPath === '') {
    throw new Error(
      'You must specify the location of the csproj file for the project.'
    );
  }

  srcPath = path.join(root, srcPath);

  if (!existsSync(srcPath)) {
    throw new Error(`Unable to locate src path, '${srcPath}'`);
  }

  const projectPath = path.join(
    root,
    context.workspace.projects[projectName].root
  );

  const version = getVersionForProject(projectPath);
  const projPaths = getAllProjectsFromFile(srcPath);

  for (let x = 0; x < projPaths.length; x++) {
    await updateCsprojVersion(projPaths[x], version);
  }

  console.log(`🎉  Version complete!`);

  return { success: true };
}
