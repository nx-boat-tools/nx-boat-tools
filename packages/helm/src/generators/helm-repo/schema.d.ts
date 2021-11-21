export interface HelmRepoGeneratorSchema {
  project: string;
  environments?: string;
  repository: string;
  chart: string;
}
