import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { DockerGeneratorSchema } from './schema';

describe('docker generator', () => {
  let appTree: Tree;
  const options: DockerGeneratorSchema = {
    name: 'test',
    dockerRepoOrUser: 'myusername',
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
