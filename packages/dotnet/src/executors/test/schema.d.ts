export interface TestDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configuration?: string;
  coveragePath?: string;
  collector?: string;
}
