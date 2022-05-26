export interface CommonChainGeneratorSchema {
  name: string;
  project: string;
  targets?: string;
  preTargets?: string;
  postTargets?: string;
}
