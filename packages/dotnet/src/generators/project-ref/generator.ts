import * as _ from 'underscore';
import * as path from 'path';
import {
  Tree,
  names,
  readJson,
  readProjectConfiguration,
  writeJson,
} from '@nrwl/devkit';
import { create } from 'xmlbuilder2';

import { ProjectRefGeneratorSchema } from './schema';

interface NormalizedSchema extends ProjectRefGeneratorSchema {
  targetPackageJsonPath: string;
  targetProjectPath: string;
  referenceProjectPath: string;
  referencePackageVersion: string;
  targetPathToRoot: string;
}

function normalizeOptions(
  tree: Tree,
  options: ProjectRefGeneratorSchema
): NormalizedSchema {
  const { project, reference } = options;

  const targetProjectConfig = readProjectConfiguration(tree, project);
  const referenceProjectConfig = readProjectConfiguration(tree, reference);

  const targetPackageJsonPath = path.join(
    targetProjectConfig.root,
    'package.json'
  );
  const referencePackageJsonPath = path.join(
    referenceProjectConfig.root,
    'package.json'
  );

  const targetProjectPath = getCsprojPath(
    tree,
    project,
    targetProjectConfig.sourceRoot
  );
  const referenceProjectPath = getCsprojPath(
    tree,
    reference,
    referenceProjectConfig.sourceRoot
  );

  const referencePackageJson = tree.exists(referencePackageJsonPath)
    ? readJson(tree, referencePackageJsonPath)
    : {};
  const referencePackageVersion = referencePackageJson?.version || '0.0.0';

  const targetPathToRoot = _.map(
    targetProjectConfig.sourceRoot.split(path.sep),
    () => '..'
  ).join('\\');

  return {
    ...options,
    targetPackageJsonPath,
    targetProjectPath,
    referenceProjectPath,
    referencePackageVersion,
    targetPathToRoot,
  };
}

function getCsprojPath(
  tree: Tree,
  project: string,
  projectRoot: string
): string {
  const projectNames = names(project);

  let csprojPath = path.join(projectRoot, `${projectNames.className}.sln`);

  if (tree.exists(csprojPath)) {
    throw new Error(
      `Unable to determine the csproj to reference for project ${project} because it has its own solution file.`
    );
  }

  csprojPath = path.join(projectRoot, `${projectNames.className}.csproj`);

  if (!tree.exists(csprojPath)) {
    throw new Error(
      `Cannot find the csproj to reference for project ${project}. File does not exist: ${csprojPath}`
    );
  }

  return csprojPath;
}

function updatePackageJson(tree: Tree, normalizedOptions: NormalizedSchema) {
  const { targetPackageJsonPath, reference, referencePackageVersion } =
    normalizedOptions;

  if (!tree.exists(targetPackageJsonPath)) {
    return;
  }

  const packageJson = readJson(tree, targetPackageJsonPath);
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.dependencies[reference] = `^${referencePackageVersion}`;

  writeJson(tree, targetPackageJsonPath, packageJson);
}

async function addCsprojReference(
  tree: Tree,
  normalizedOptions: NormalizedSchema
): Promise<void> {
  const { targetPathToRoot, targetProjectPath, referenceProjectPath } =
    normalizedOptions;

  const csprojBuffer = tree.read(targetProjectPath);

  if (csprojBuffer === null) {
    throw new Error(
      `Unable to read the csproj file specified, '${targetProjectPath}'`
    );
  }

  let xmlString = csprojBuffer.toString();
  let xmlDoc = create(xmlString);
  const doc: any = xmlDoc.end({ format: 'object' });

  const itemGroupToAdd = {
    ProjectReference: {
      ['@Include']: `${targetPathToRoot}\\${referenceProjectPath
        .split(path.sep)
        .join('\\')}`,
    },
  };

  if (doc.Project.ItemGroup === undefined) {
    doc.Project.ItemGroup = itemGroupToAdd;
  } else {
    const itemGroups = !_.isArray(doc.Project.ItemGroup)
      ? [doc.Project.ItemGroup]
      : doc.Project.ItemGroup;

    const projectRefItemGroup = _.find(
      itemGroups,
      (itemGroup) => itemGroup.ProjectReference !== undefined
    );

    if (projectRefItemGroup === undefined) {
      itemGroups.push(itemGroupToAdd);
    } else {
      const projectRefs = !_.isArray(projectRefItemGroup.ProjectReference)
        ? [projectRefItemGroup.ProjectReference]
        : projectRefItemGroup.ProjectReference;

      projectRefs.push(itemGroupToAdd.ProjectReference);

      projectRefItemGroup.ProjectReference = projectRefs;
    }

    doc.Project.ItemGroup = itemGroups;
  }

  xmlDoc = create(doc);
  xmlString = xmlDoc.end({ prettyPrint: true, headless: true });

  tree.write(targetProjectPath, xmlString);
}

export default async function (tree: Tree, options: ProjectRefGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  updatePackageJson(tree, normalizedOptions);
  addCsprojReference(tree, normalizedOptions);
}
