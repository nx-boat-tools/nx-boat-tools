export interface WebApiGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  ownSolution: boolean;
  isStandaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
