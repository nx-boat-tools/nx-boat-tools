export interface CleanDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configuration?: string;
}
