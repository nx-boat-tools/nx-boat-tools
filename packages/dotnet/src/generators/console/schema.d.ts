export interface ConsoleAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  ownSolution: boolean;
  isStandaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
