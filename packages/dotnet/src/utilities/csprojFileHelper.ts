import * as _ from 'underscore';
import { create } from 'xmlbuilder2';
import { readFileSync, writeFileSync } from 'fs';

export function createTestCsprojContent(
  packageRefs?: Array<string>,
  projectRefs?: Array<string>
): string {
  packageRefs ??= [];
  projectRefs ??= [];

  packageRefs = _.map(packageRefs, (ref) => {
    return `
    <PackageReference Include="${ref}" Version="1.0.0" />`;
  });
  projectRefs = _.map(projectRefs, (ref) => {
    return `
    <ProjectReference Include="${ref}" />`;
  });

  const packageRefGroup = !_.some(packageRefs)
    ? ''
    : `
  <ItemGroup>${packageRefs.join('')}
  </ItemGroup>`;
  const projectRefGroup = !_.some(projectRefs)
    ? ''
    : `
  <ItemGroup>${projectRefs.join('')}
  </ItemGroup>`;

  return `
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net5.0</TargetFramework>
  </PropertyGroup>
  ${packageRefGroup}
  ${projectRefGroup}

</Project>
    `;
}

export async function updateCsprojFile(
  dotnetProjectPath: string,
  editFunction: (doc: any) => void
): Promise<void> {
  if (editFunction === undefined) {
    throw new Error(
      `No edit function was provided for updating the csproj file.`
    );
  }

  console.log(`📝 Updating csproj file '${dotnetProjectPath}'...`);

  const csprojBuffer = readFileSync(dotnetProjectPath);

  if (csprojBuffer === null) {
    throw new Error(
      `Unable to read the csproj file specified, '${dotnetProjectPath}'`
    );
  }

  let xmlString = csprojBuffer.toString();
  let xmlDoc = create(xmlString);
  const doc: any = xmlDoc.end({ format: 'object' });

  editFunction(doc);

  xmlDoc = create(doc);
  xmlString = xmlDoc.end({ prettyPrint: true, headless: true });

  writeFileSync(dotnetProjectPath, xmlString);

  console.log('');
}

export function getProjectReferencesFromCsprojFile(
  dotnetProjectPath: string
): Array<string> {
  const csprojBuffer = readFileSync(dotnetProjectPath);

  if (csprojBuffer === null) {
    throw new Error(
      `Unable to read the csproj file specified, '${dotnetProjectPath}'`
    );
  }

  const xmlString = csprojBuffer.toString();
  const xmlDoc = create(xmlString);
  const doc: any = xmlDoc.end({ format: 'object' });

  if (doc.Project.ItemGroup === undefined) {
    return [];
  }

  const itemGroups = !_.isArray(doc.Project.ItemGroup)
    ? [doc.Project.ItemGroup]
    : doc.Project.ItemGroup;

  const results: Array<string> = _.flatten(
    _.map(itemGroups, (itemGroup) => {
      if (itemGroup.ProjectReference === undefined) {
        return undefined;
      }

      const projectRefs = !_.isArray(itemGroup.ProjectReference)
        ? [itemGroup.ProjectReference]
        : itemGroup.ProjectReference;

      return _.map(projectRefs, (projectRef) => {
        return projectRef['@Include'];
      });
    })
  );

  return _.without(results, undefined);
}
