export interface GrpcAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  ownSolution: boolean;
  standaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
  testProjectType?: 'mstest' | 'nunit' | 'xunit' | 'none';
}
