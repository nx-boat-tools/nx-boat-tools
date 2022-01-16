export interface DotNetCommandExecutorSchema {
  action: string;
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configMap?: JsonObject;
}
