export interface DotnetTestProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  standaloneConfig?: boolean;
  frameworkVersion?: 'latest' | 'LTS';
  testPrefix?: string;
  testType: 'mstest' | 'nunit' | 'xunit';
}
