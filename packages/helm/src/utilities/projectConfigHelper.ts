import * as _ from 'underscore';
import {
  ChainExecutorStage,
  appendToChainTargets,
} from '@nx-boat-tools/common';
import { TargetConfiguration } from '@nrwl/devkit';
import path = require('path');

export interface HelmTargetsConfig {
  projectDistPath: string;
  projectHelmPath: string;
  runBuildTarget: string;
  runResourceName?: string;
  runHostPort?: number;
  runContainerPort?: number;
  runValuesPaths: Array<string>;
  repository?: string;
  chart?: string;
}

export function getHelmAppendedBuildTargets(
  projectTargets: { [targetName: string]: TargetConfiguration },
  projectName: string,
  helmTargetsConfig: HelmTargetsConfig,
  isLocalChart = false
): { [targetName: string]: TargetConfiguration } {
  verifyConfig(helmTargetsConfig, projectName, isLocalChart);

  const { projectHelmPath, projectDistPath } = helmTargetsConfig;

  const copyHelmValues = 'copyHelmValues';
  const installHelmChart = 'installHelmChart';
  const lintHelmChart = 'lintHelmChart';
  const packageHelmChart = 'packageHelmChart';
  const portForwardToMinikube = 'portForwardToMinikube';
  const uninstallHelmChart = 'uninstallHelmChart';

  const packageTargets = [copyHelmValues];

  let localBuildStages = {};
  let localChartTargets = {};
  let repoChartTargets = {};

  const buildStages =
    helmTargetsConfig.runBuildTarget === undefined
      ? {}
      : {
          build: {
            targets: [helmTargetsConfig.runBuildTarget],
          },
        };

  if (isLocalChart) {
    packageTargets.push(packageHelmChart);

    localBuildStages = {
      build: {
        stagesToAdd: {
          helmChart: {
            targets: [lintHelmChart],
          } as ChainExecutorStage,
        },
      },
    };

    localChartTargets = {
      [lintHelmChart]: {
        executor: '@nx-boat-tools/helm:lint',
        options: {
          projectHelmPath: projectHelmPath,
        },
      },
      [packageHelmChart]: {
        executor: '@nx-boat-tools/helm:package',
        options: {
          projectHelmPath: projectHelmPath,
          outputPath: path.join(projectDistPath, 'helm', 'chart'),
        },
      },
      [installHelmChart]: {
        executor: '@nx-boat-tools/helm:installLocalChart',
        options: {
          projectHelmPath: projectHelmPath,
          valuesFilePaths: helmTargetsConfig.runValuesPaths,
        },
      },
    };
  } else {
    repoChartTargets = {
      [installHelmChart]: {
        executor: '@nx-boat-tools/helm:installRepoChart',
        options: {
          projectHelmPath: projectHelmPath,
          repository: helmTargetsConfig.repository,
          chart: helmTargetsConfig.chart,
          valuesFilePaths: helmTargetsConfig.runValuesPaths,
        },
      },
    };
  }

  const targets = {
    ...appendToChainTargets(projectTargets, {
      package: {
        stagesToAdd: {
          helmChart: {
            targets: packageTargets,
          } as ChainExecutorStage,
        },
      },
      runHelmChart: {
        additionalTargetsToAdd: [
          installHelmChart,
          portForwardToMinikube,
          uninstallHelmChart,
        ],
        stagesToAdd: {
          ...buildStages,
        },
      },
      ...localBuildStages,
    }),
    [copyHelmValues]: {
      executor: '@nx-boat-tools/helm:copyValues',
      options: {
        projectHelmPath: projectHelmPath,
        outputPath: path.join(projectDistPath, 'helm', 'values'),
      },
    },
    [portForwardToMinikube]: {
      executor: '@nx-boat-tools/helm:portForward',
      options: {
        resourceName: helmTargetsConfig.runResourceName,
        hostPort: helmTargetsConfig.runHostPort,
        containerPort: helmTargetsConfig.runContainerPort,
      },
    },
    [uninstallHelmChart]: {
      executor: '@nx-boat-tools/helm:uninstall',
      options: {},
    },
    ...localChartTargets,
    ...repoChartTargets,
  };

  const sortetTargetKeys = _.keys(targets).sort();

  return _.object(
    sortetTargetKeys,
    sortetTargetKeys.map((key) => targets[key])
  );
}

function verifyConfig(
  config: HelmTargetsConfig,
  projectName: string,
  isLocalChart: boolean
) {
  if (projectName === undefined) {
    throw new Error('No project specified.');
  }

  if (config.projectDistPath === undefined) {
    throw new Error('No project dist path specified.');
  }

  if (config.projectHelmPath === undefined) {
    throw new Error('No project helm path specified.');
  }

  if (
    !isLocalChart &&
    (config.repository === undefined || config.chart === undefined)
  ) {
    throw new Error(
      'You must secify both a repository and chart for a remote chart.'
    );
  }

  config.runResourceName ??= `deploymenet/${projectName}`;
  config.runHostPort ??= 8080;
  config.runContainerPort ??= 80;
  config.runValuesPaths ??= [];
}
