export interface PackageDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configuration?: string;
  updateVersion: boolean;
}
