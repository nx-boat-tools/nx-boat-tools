import { create } from 'xmlbuilder2';
import { readFileSync, writeFileSync } from 'fs';

export function createTestCsprojContent(): string {
  return `
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net5.0</TargetFramework>
  </PropertyGroup>

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
