export interface DotnetTestProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  standaloneConfig?: boolean;
  testPrefix?: string;
  testType: 'mstest' | 'nunit' | 'xunit';
  frameworkVersion?: 'latest' | 'LTS';
}
