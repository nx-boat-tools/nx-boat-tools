export interface GrpcAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  ownSolution: boolean;
  isStandaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
}
