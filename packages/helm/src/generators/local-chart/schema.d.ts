export interface HelmLocalChartGeneratorSchema {
  project: string;
  environments?: string;
  createValues: boolean;
  runBuildTarget?: string;
  runResourceName?: string;
  runHostPort?: number;
  runContainerPort?: number;
}
