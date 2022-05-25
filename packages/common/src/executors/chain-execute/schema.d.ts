export type NamedChainExecutorStages = { [stage: string]: ChainExecutorStage };

export interface RootChainExecutorStage {
  targets?: Array<string>;
  preTargets?: Array<string>;
  postTargets?: Array<string>;
}

export interface ChainExecutorStage extends RootChainExecutorStage {
  explicit?: boolean;
}

export interface ChainExecutorSchema extends RootChainExecutorStage {
  run?: Array<string>;
  stages?: NamedChainExecutorStages;
}
