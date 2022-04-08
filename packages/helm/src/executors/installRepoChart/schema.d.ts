export interface HelmInstallRepoChartExecutorSchema {
  repository: string;
  chart: string;
  valuesFilePaths?: string[];
  dryRun?: boolean;
}
