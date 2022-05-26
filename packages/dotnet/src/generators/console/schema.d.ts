export interface ConsoleAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  ownSolution: boolean;
  standaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
