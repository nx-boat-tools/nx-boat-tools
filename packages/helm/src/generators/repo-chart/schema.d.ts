export interface HelmRepoChartGeneratorSchema {
  project: string;
  environments?: string;
  repository: string;
  chart: string;
  runBuildTarget?: string;
  runResourceName?: string;
  runHostPort?: number;
  runContainerPort?: number;
}
