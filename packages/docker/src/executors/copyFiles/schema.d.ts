export interface DockerCopyFilesExecutorSchema {
  dockerFilePath: string;
  dockerIgnorePath?: string;
  distPath: string;
}
