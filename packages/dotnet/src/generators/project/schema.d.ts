export interface DotnetGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  projectType: string;
  ownSolution: boolean;
  isStandaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
