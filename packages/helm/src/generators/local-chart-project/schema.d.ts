export interface HelmLocalChartProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  environments?: string;
  createValues: boolean;
}
