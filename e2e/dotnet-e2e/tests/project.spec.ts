import { names } from '@nrwl/devkit';
import {
  checkFilesExist,
  ensureNxProject,
  patchPackageJsonForPlugin,
  readJson,
  runNxCommandAsync,
  runPackageManagerInstall,
  uniq,
} from '@nrwl/nx-plugin/testing';
import * as minimist from 'minimist';
import _ = require('underscore');

function copyProjectDependencies() {
  ensureNxProject('@nx-boat-tools/dotnet', 'dist/packages/dotnet');

  // patchPackageJsonForPlugin('@nx-boat-tools/common', 'dist/packages/common');
  // runPackageManagerInstall();
}

function logIfVerbose(message?: any, ...optionalParams: any[]) {
  const args = minimist(process.argv);
  const verbose = _.keys(args).includes('verbose')
    ? args['verbose'] == true
    : false;

  if (verbose) {
    console.log(message, ...optionalParams);
  }
}

describe('dotnet e2e', () => {
  it.only('should create project', async () => {
    const plugin = uniq('project');
    ensureNxProject('@nx-boat-tools/dotnet', 'dist/packages/dotnet');

    patchPackageJsonForPlugin('@nx-boat-tools/common', 'dist/packages/common');
    runPackageManagerInstall();

    await runNxCommandAsync(
      `generate @nx-boat-tools/dotnet:project ${plugin} --projectType console`
    );

    const result = await runNxCommandAsync(
      `build ${plugin} --configuration=dev`
    );

    logIfVerbose(result.stdout);

    expect(result.stdout).toContain('Saving VERSION file for build');
    expect(result.stdout).toContain('Building complete!');
    expect(result.stdout).not.toContain('Packing complete!');
  }, 120000);

  it('should create classlib', async () => {
    const plugin = uniq('classlib');
    await runNxCommandAsync(
      `generate @nx-boat-tools/dotnet:classlib ${plugin}`
    );

    const result = await runNxCommandAsync(
      `build ${plugin} --configuration=prod`
    );

    logIfVerbose(result.stdout);

    expect(result.stdout).toContain('Saving VERSION file for build');
    expect(result.stdout).toContain('Building complete!');
    expect(result.stdout).toContain('Packing complete!');
  }, 120000);

  it('should create console', async () => {
    const plugin = uniq('console');
    await runNxCommandAsync(`generate @nx-boat-tools/dotnet:console ${plugin}`);

    const result = await runNxCommandAsync(
      `build ${plugin} --configuration=prod`
    );

    logIfVerbose(result.stdout);

    expect(result.stdout).toContain('Saving VERSION file for build');
    expect(result.stdout).toContain('Building complete!');
    expect(result.stdout).toContain('Packing complete!');
  }, 120000);

  it('should create webapi', async () => {
    const plugin = uniq('webapi');
    await runNxCommandAsync(`generate @nx-boat-tools/dotnet:webapi ${plugin}`);

    const result = await runNxCommandAsync(
      `build ${plugin} --configuration=prod`
    );

    logIfVerbose(result.stdout);

    expect(result.stdout).toContain('Saving VERSION file for build');
    expect(result.stdout).toContain('Building complete!');
    expect(result.stdout).toContain('Packing complete!');
  }, 120000);

  describe('--ownSolution', () => {
    it('should create root sln when false', async () => {
      const plugin = uniq('dotnet');
      await runNxCommandAsync(
        `generate @nx-boat-tools/dotnet:project ${plugin} --projectType console`
      );
      const _names = names(plugin);
      expect(() =>
        checkFilesExist(
          `apps/${_names.propertyName}/${_names.className}.csproj`,
          `proj.sln`
        )
      ).not.toThrow();
    }, 120000);

    it('should create project sln when true', async () => {
      const plugin = uniq('dotnet');
      await runNxCommandAsync(
        `generate @nx-boat-tools/dotnet:project ${plugin} --projectType console --ownSolution`
      );
      const _names = names(plugin);
      expect(() =>
        checkFilesExist(
          `apps/${_names.propertyName}/${_names.className}/${_names.className}.csproj`,
          `apps/${_names.propertyName}/${_names.className}.sln`
        )
      ).not.toThrow();
    }, 120000);
  });

  // describe('--directory', () => {
  //   it('should create src in the specified directory', async () => {
  //     const plugin = uniq('dotnet');
  //     ensureNxProject('@nx-boat-tools/dotnet', 'dist/packages/dotnet');
  //     await runNxCommandAsync(
  //       `generate @nx-boat-tools/dotnet:dotnet ${plugin} --directory subdir`
  //     );
  //     expect(() =>
  //       checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
  //     ).not.toThrow();
  //   }, 120000);
  // });

  // describe('--tags', () => {
  //   it('should add tags to nx.json', async () => {
  //     const plugin = uniq('dotnet');
  //     ensureNxProject('@nx-boat-tools/dotnet', 'dist/packages/dotnet');
  //     await runNxCommandAsync(
  //       `generate @nx-boat-tools/dotnet:dotnet ${plugin} --tags e2etag,e2ePackage`
  //     );
  //     const nxJson = readJson('nx.json');
  //     expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
  //   }, 120000);
  // });
});
