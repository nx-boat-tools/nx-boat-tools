export interface BuildDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configuration?: string;
}
