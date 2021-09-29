export interface PackageDotnetExecutorSchema {
  additionalArgs?: string;
  srcPath: string;
  outputPath: string;
  runtimeID?: string;
  configMap?: JsonObject;
  updateVersion: boolean;
}
