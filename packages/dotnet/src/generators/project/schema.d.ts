export interface DotnetGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  projectType: string;
  ownSolution: boolean;
  standaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
