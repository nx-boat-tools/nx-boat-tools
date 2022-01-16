import * as _ from 'underscore';
import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';
import { getVersionForProject } from '@nx-boat-tools/common';

import { DotNetVersionExecutorSchema } from './schema';
import { getAllProjectsFromFile } from '../../utilities/slnFileHelper';
import { updateCsprojFile } from '../../utilities/csprojFileHelper';

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

  const version = getVersionForProject(projectPath) || '0.0.0';
  const projPaths = getAllProjectsFromFile(srcPath);

  for (let x = 0; x < projPaths.length; x++) {
    await updateCsprojVersion(projPaths[x], version);
  }

  console.log(`🎉  Version complete!`);

  return { success: true };
}
