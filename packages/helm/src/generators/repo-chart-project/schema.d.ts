export interface HelmRepoChartProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  environments?: string;
  repository: string;
  chart: string;
}
