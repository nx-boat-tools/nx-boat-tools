export interface HelmLocalGeneratorSchema {
  project: string;
  buildPath: string;
  environments: string;
  createValues: boolean;
}
