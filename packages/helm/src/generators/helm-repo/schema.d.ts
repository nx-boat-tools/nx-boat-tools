export interface HelmRepoGeneratorSchema {
  project: string;
  buildPath: string;
  environments: string;
  repository: string;
  chart: string;
}
