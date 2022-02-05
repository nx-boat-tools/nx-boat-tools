export interface HelmRepoChartGeneratorSchema {
  project: string;
  environments?: string;
  repository: string;
  chart: string;
}
