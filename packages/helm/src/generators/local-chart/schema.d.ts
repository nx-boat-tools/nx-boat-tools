export interface HelmLocalChartGeneratorSchema {
  project: string;
  environments?: string;
  createValues: boolean;
}
