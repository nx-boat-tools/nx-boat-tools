export interface WebApiGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  pathPrefix?: string;
  ownSolution: boolean;
}
