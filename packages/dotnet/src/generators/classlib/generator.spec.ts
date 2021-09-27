import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { ClassLibraryGeneratorSchema } from './schema';

describe('dotnet generator', () => {
  let appTree: Tree;
  const options: ClassLibraryGeneratorSchema = { 
    name: 'test',
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
