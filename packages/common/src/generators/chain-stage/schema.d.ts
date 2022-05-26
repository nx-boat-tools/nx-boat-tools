export interface CommonChainStageGeneratorSchema {
  name: string;
  chainTarget: string;
  project: string;
  targets?: string;
  preTargets?: string;
  postTargets?: string;
}
