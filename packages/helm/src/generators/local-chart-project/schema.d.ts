export interface HelmLocalChartProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  environments?: string;
  createValues: boolean;
  runBuildTarget?: string;
  runResourceName?: string;
  runHostPort?: number;
  runContainerPort?: number;
  standaloneConfig?: boolean;
}
