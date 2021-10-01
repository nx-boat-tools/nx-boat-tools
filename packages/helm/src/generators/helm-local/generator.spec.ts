import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { HelmLocalGeneratorSchema } from './schema';

describe('helm generator', () => {
  let appTree: Tree;
  const options: HelmLocalGeneratorSchema = {
    project: 'test',
    createValues: true,
    environments: '',
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
