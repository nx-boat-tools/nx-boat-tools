export interface DotnetTestGeneratorSchema {
  project: string;
  testPrefix?: string;
  testType: 'mstest' | 'nunit' | 'xunit';
  frameworkVersion?: 'latest' | 'LTS';
}
