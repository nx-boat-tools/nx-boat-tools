import * as path from 'path';
import { existsSync, readFileSync } from 'fs';

export function getVersionForProject(
  projectPath: string,
  throwOnPackageJsonNotFound = true
): string | undefined {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    if (throwOnPackageJsonNotFound) {
      throw new Error(
        `Unable to detect version. No package.json found at '${packageJsonPath}'!`
      );
    } else {
      return undefined;
    }
  }

  const projectPackageJsonBuffer = readFileSync(packageJsonPath);
  const projectPackageJsonString = projectPackageJsonBuffer.toString();
  const projectPackageJson = JSON.parse(projectPackageJsonString);

  return projectPackageJson?.version;
}
