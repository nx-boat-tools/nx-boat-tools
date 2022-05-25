export interface DotnetTestProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  isStandaloneConfig?: boolean;
  testPrefix?: string;
  testType: 'mstest' | 'nunit' | 'xunit';
  frameworkVersion?: 'latest' | 'LTS';
}
