import { Console } from 'console';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import * as dotnetProjectGenerator from '../project/generator';
import generator from './generator';
import { DotnetGeneratorSchema } from '../project/schema';
import { WebApiGeneratorSchema } from './schema';

console = new Console(process.stdout, process.stderr); //mockFs messes with the console. Adding this before the fs is mocked fixes it

const spy = jest.spyOn(dotnetProjectGenerator, 'default');
const mockedRunExecutor = jest.fn(
  (tree: Tree, options: DotnetGeneratorSchema): Promise<void> => {
    console.log('Called mock dotnet project generator', options);

    return Promise.resolve();
  }
);

describe('Dotnet webapi Generator', () => {
  let appTree: Tree;

  beforeAll(() => {
    spy.mockImplementation(mockedRunExecutor);
  });

  afterAll(() => {
    mockedRunExecutor.mockRestore();
  });

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();

    console.log(`\nRunning Test '${expect.getState().currentTestName}'...\n`);
  });

  afterEach(() => {
    mockedRunExecutor.mockClear();

    console.log(`\nTest '${expect.getState().currentTestName}' Complete!\n`);
  });

  it('successfully calls Dotnet Project Generator', async () => {
    const options: WebApiGeneratorSchema = {
      name: 'my-project',
      ownSolution: false,
    };

    await generator(appTree, options);

    expect(mockedRunExecutor.mock.calls.length).toBe(1);

    const firstCall: any[] = mockedRunExecutor.mock.calls[0];
    const schemaArg: DotnetGeneratorSchema = firstCall[1];

    expect(schemaArg.projectType).toBe('webapi');
    expect(schemaArg.name).toBe(options.name);
    expect(schemaArg.tags).toBe(options.tags);
    expect(schemaArg.directory).toBe(options.directory);
    expect(schemaArg.ownSolution).toBe(options.ownSolution);
  });
});
