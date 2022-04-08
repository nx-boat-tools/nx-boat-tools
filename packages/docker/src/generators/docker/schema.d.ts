export interface DockerGeneratorSchema {
  project: string;
  dockerRepoOrUser: string;
  minikube?: boolean;
  baseDockerImage?: string;
  runPortMappings?: string;
  runVolumeMounts?: string;
  runVariables?: string;
}
