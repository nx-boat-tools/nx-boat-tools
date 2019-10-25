
export interface Schema {
  name: string;
  pathPrefix?: string;
  directory?: string;
  tags?: string;
  simpleModuleName: boolean;
  ownSolution: boolean;
}