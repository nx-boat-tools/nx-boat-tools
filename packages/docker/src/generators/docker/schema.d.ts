export interface DockerGeneratorSchema {
  project: string;
  dockerRepoOrUser: string;
  minikube?: boolean;
}
