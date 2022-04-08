export interface HelmInstallLocalChartExecutorSchema {
  projectHelmPath: string;
  valuesFilePaths?: string[];
  dryRun?: boolean;
}
