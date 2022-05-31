import * as _ from 'underscore';
import * as mockFs from 'mock-fs';
import each from 'jest-each';
import { Console } from 'console';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  readJson,
  readProjectConfiguration,
  writeJson,
} from '@nrwl/devkit';
import { createTargetConfig, defuse } from '@nx-boat-tools/common';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { readFileSync } from 'fs';

import generator from './generator';
import { ProjectRefGeneratorSchema } from './schema';
import { createTestCsprojContent, getProjectReferencesFromCsprojFile } from '../../utilities/csprojFileHelper';
import { createTestSlnContent } from '../../utilities/slnFileHelper';

import path = require('path');
import { create } from 'xmlbuilder2';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

describe('dotnet project-ref generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockFs.restore();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('fails when target project does not exist', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'test',
      reference: 'my-lib',
    };

    addProjectConfiguration(appTree, 'my-project', {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    });

    addProjectConfiguration(appTree, 'my-lib', {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Cannot find configuration for '${options.project}' in /workspace.json.`
    );
  });

  it('fails when reference project does not exist', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    addProjectConfiguration(appTree, 'my-project', {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    });

    addProjectConfiguration(appTree, 'test', {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    });

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Cannot find configuration for '${options.reference}' in /workspace.json.`
    );
  });

  it('fails when target project has own solution', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.sln`);

    appTree.write(
      targetPath,
      createTestSlnContent([{ name: 'MyProject', root: 'MyProject' }])
    );

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Unable to determine the csproj to reference for project ${options.project} because it has its own solution file.`
    );
  });

  it('fails when reference project has own solution', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.sln`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(
      referencePath,
      createTestSlnContent([{ name: 'MyLib', root: 'MyLib' }])
    );

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Unable to determine the csproj to reference for project ${options.reference} because it has its own solution file.`
    );
  });

  it('fails when reference project has own solution', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(
      targetConfig.sourceRoot,
      `RandomlyNamed.csproj`
    );
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    const expectedPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Cannot find the csproj to reference for project ${options.project}. File does not exist: ${expectedPath}`
    );
  });

  it('fails when reference project has own solution', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(
      referenceConfig.sourceRoot,
      `RandomlyNamed.csproj`
    );

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    const expectedPath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    expect(defuse(generator(appTree, options))).rejects.toThrow(
      `Cannot find the csproj to reference for project ${options.reference}. File does not exist: ${expectedPath}`
    );
  });

  it('does not fail when no target package.json exists', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);
  });

  it('adds target package.json dependencies (reference project package.json does not exist)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPackageJsonPath = path.join(targetConfig.root, `package.json`);

    writeJson(appTree, targetPackageJsonPath, { name: options.project });

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const packageJson = readJson(appTree, targetPackageJsonPath);

    expect(packageJson?.dependencies).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBe('^0.0.0');
  });

  it('updates target package.json dependencies (reference project package.json does not exist)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPackageJsonPath = path.join(targetConfig.root, `package.json`);

    writeJson(appTree, targetPackageJsonPath, {
      name: options.project,
      dependencies: { someDep: '^1.0.0' },
    });

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const packageJson = readJson(appTree, targetPackageJsonPath);

    expect(packageJson?.dependencies).toBeDefined();
    expect(packageJson?.dependencies.someDep).toBe('^1.0.0');
    expect(packageJson?.dependencies[options.reference]).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBe('^0.0.0');
  });

  it('adds target package.json dependencies (reference project package.json exists)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPackageJsonPath = path.join(targetConfig.root, `package.json`);
    const referencePackageJsonPath = path.join(
      referenceConfig.root,
      `package.json`
    );

    writeJson(appTree, targetPackageJsonPath, { name: options.project });
    writeJson(appTree, referencePackageJsonPath, {
      name: options.reference,
      version: '2.0.0',
    });

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const packageJson = readJson(appTree, targetPackageJsonPath);

    expect(packageJson?.dependencies).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBe('^2.0.0');
  });

  it('updates target package.json dependencies (reference project package.json exists)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPackageJsonPath = path.join(targetConfig.root, `package.json`);
    const referencePackageJsonPath = path.join(
      referenceConfig.root,
      `package.json`
    );

    writeJson(appTree, targetPackageJsonPath, {
      name: options.project,
      dependencies: { someDep: '^1.0.0' },
    });
    writeJson(appTree, referencePackageJsonPath, {
      name: options.reference,
      version: '2.0.0',
    });

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(referenceConfig.sourceRoot, `MyLib.csproj`);

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const packageJson = readJson(appTree, targetPackageJsonPath);

    expect(packageJson?.dependencies).toBeDefined();
    expect(packageJson?.dependencies.someDep).toBe('^1.0.0');
    expect(packageJson?.dependencies[options.reference]).toBeDefined();
    expect(packageJson?.dependencies[options.reference]).toBe('^2.0.0');
  });

  it('adds ProjectReference to target csproj (no existing references)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(
      referenceConfig.sourceRoot,
      `MyLib.csproj`
    );

    appTree.write(targetPath, createTestCsprojContent());
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const xmlString = appTree.read(targetPath).toString();
    const xmlDoc = create(xmlString);

    const doc: any = xmlDoc.end({ format: 'object' });

    expect(doc?.Project?.ItemGroup).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup)).toBe(false);

    expect(doc?.Project?.ItemGroup?.ProjectReference).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup.ProjectReference)).toBe(false);
    expect(doc.Project.ItemGroup.ProjectReference['@Include']).toBe(`..\\..\\..\\${referenceConfig.sourceRoot.split(path.sep).join('\\')}\\MyLib.csproj`);
  });

  it('adds ProjectReference to target csproj (existing project reference)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(
      referenceConfig.sourceRoot,
      `MyLib.csproj`
    );

    appTree.write(targetPath, createTestCsprojContent([], ["ExistingRef.csproj"]));
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const xmlString = appTree.read(targetPath).toString();
    const xmlDoc = create(xmlString);

    const doc: any = xmlDoc.end({ format: 'object' });

    expect(doc?.Project?.ItemGroup).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup)).toBe(false);

    expect(doc?.Project?.ItemGroup?.ProjectReference).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup.ProjectReference)).toBe(true);
    expect(doc.Project.ItemGroup.ProjectReference.length).toBe(2);
    expect(doc.Project.ItemGroup.ProjectReference[0]['@Include']).toBe('ExistingRef.csproj');
    expect(doc.Project.ItemGroup.ProjectReference[1]['@Include']).toBe(`..\\..\\..\\${referenceConfig.sourceRoot.split(path.sep).join('\\')}\\MyLib.csproj`);
  });

  it('adds ProjectReference to target csproj (existing package reference)', async () => {
    const options: ProjectRefGeneratorSchema = {
      project: 'my-project',
      reference: 'my-lib',
    };

    const targetConfig: ProjectConfiguration = {
      root: 'apps/my-project',
      sourceRoot: 'apps/my-project/src',
      projectType: 'application',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };
    const referenceConfig: ProjectConfiguration = {
      root: 'libs/my-lib',
      sourceRoot: 'libs/my-lib/src',
      projectType: 'library',
      targets: createTargetConfig([
        { name: 'build', echo: 'Hello from build' },
      ]),
    };

    addProjectConfiguration(appTree, 'my-project', targetConfig);
    addProjectConfiguration(appTree, 'my-lib', referenceConfig);

    const targetPath = path.join(targetConfig.sourceRoot, `MyProject.csproj`);
    const referencePath = path.join(
      referenceConfig.sourceRoot,
      `MyLib.csproj`
    );

    appTree.write(targetPath, createTestCsprojContent(["SomePackage"]));
    appTree.write(referencePath, createTestCsprojContent());

    await generator(appTree, options);

    const xmlString = appTree.read(targetPath).toString();
    const xmlDoc = create(xmlString);

    const doc: any = xmlDoc.end({ format: 'object' });

    expect(doc?.Project?.ItemGroup).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup)).toBe(true);
    expect(doc.Project.ItemGroup.length).toBe(2);

    expect(doc.Project.ItemGroup[0].PackageReference).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup[0].PackageReference)).toBe(false);
    expect(doc.Project.ItemGroup[0].PackageReference['@Include']).toBe('SomePackage');
    expect(doc.Project.ItemGroup[0].PackageReference['@Version']).toBe('1.0.0');

    expect(doc.Project.ItemGroup[1].ProjectReference).toBeDefined();
    expect(_.isArray(doc.Project.ItemGroup[1].ProjectReference)).toBe(false);
    expect(doc.Project.ItemGroup[1].ProjectReference['@Include']).toBe(`..\\..\\..\\${referenceConfig.sourceRoot.split(path.sep).join('\\')}\\MyLib.csproj`);
  });
});
