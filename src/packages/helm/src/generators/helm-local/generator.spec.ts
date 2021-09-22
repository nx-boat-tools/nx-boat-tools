import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { HelmLocalGeneratorSchema } from './schema';

describe('helm generator', () => {
  let appTree: Tree;
  const options: HelmLocalGeneratorSchema = {
    project: 'test',
    buildPath: './dist/apps/test',
    createValues: true,
    environments: ''
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
