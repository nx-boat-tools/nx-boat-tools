export interface PublishDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configuration?: string;
}
