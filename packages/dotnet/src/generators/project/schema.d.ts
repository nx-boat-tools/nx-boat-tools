export interface DotnetGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  projectType: string;
  pathPrefix?: string;
  simpleModuleName: boolean;
  ownSolution: boolean;
}
