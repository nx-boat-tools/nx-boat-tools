export interface DockerGeneratorSchema {
  name: string;
  dockerRepoOrUser: string;
  tags?: string;
  directory?: string;
}
