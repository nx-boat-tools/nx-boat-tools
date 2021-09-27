import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { DotnetGeneratorSchema } from './schema';

describe('dotnet generator', () => {
  let appTree: Tree;
  const options: DotnetGeneratorSchema = { 
    name: 'test',
    projectType: 'classlib',
    simpleModuleName: false,
    ownSolution: false
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
