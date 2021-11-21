export interface HelmLocalGeneratorSchema {
  project: string;
  environments?: string;
  createValues: boolean;
}
