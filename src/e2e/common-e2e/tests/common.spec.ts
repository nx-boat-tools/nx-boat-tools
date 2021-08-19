import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('common e2e', () => {
  it('should create common', async () => {
    const plugin = uniq('common');
    ensureNxProject('@nx-boat-tools/common', 'dist/packages/common');
    await runNxCommandAsync(`generate @nx-boat-tools/common:common ${plugin}`);

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Executor ran');
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const plugin = uniq('common');
      ensureNxProject('@nx-boat-tools/common', 'dist/packages/common');
      await runNxCommandAsync(
        `generate @nx-boat-tools/common:common ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async () => {
      const plugin = uniq('common');
      ensureNxProject('@nx-boat-tools/common', 'dist/packages/common');
      await runNxCommandAsync(
        `generate @nx-boat-tools/common:common ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });
});
