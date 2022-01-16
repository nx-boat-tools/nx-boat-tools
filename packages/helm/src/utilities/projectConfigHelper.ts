import * as _ from 'underscore';
import {
  NxJsonProjectConfiguration,
  ProjectConfiguration,
  TargetConfiguration,
} from '@nrwl/devkit';
import path = require('path');

export function getHelmAppendedBuildTargets(
  projectDistPath: string,
  projectHelmPath: string,
  projectConfig: ProjectConfiguration & NxJsonProjectConfiguration,
  addPackageTarget = false
): { [targetName: string]: TargetConfiguration } {
  const build = 'build';
  const buildSrc = 'buildSrc';
  const packageHelmChart = 'packageHelmChart';
  const copyHelmValues = getCopyHelmValuesName(projectConfig.targets);

  const targets = projectConfig.targets;
  targets[copyHelmValues] = {
    executor: '@nx-boat-tools/helm:copyValues',
    options: {
      projectHelmPath: projectHelmPath,
      outputPath: path.join(projectDistPath, 'helm', 'values'),
    },
  };

  if (addPackageTarget) {
    targets[packageHelmChart] = {
      executor: '@nx-boat-tools/helm:package',
      options: {
        projectHelmPath: projectHelmPath,
        outputPath: path.join(projectDistPath, 'helm', 'chart'),
      },
    };
  }

  if (copyHelmValues !== 'build') {
    if (targets[build]?.executor === '@nx-boat-tools/common:chain-execute') {
      if (!targets[build].options.targets.includes(copyHelmValues)) {
        targets[build].options.targets.push(copyHelmValues);
      }
    } else {
      if (targets[build] !== undefined) {
        targets[buildSrc] = targets[build];
      }

      targets[build] = {
        executor: '@nx-boat-tools/common:chain-execute',
        options: {
          targets: ['buildSrc', copyHelmValues],
        },
      };
    }
  }

  if (addPackageTarget) {
    targets[build].options.additionalTargets =
      targets[build].options.additionalTargets || [];

    if (!targets[build].options.additionalTargets.includes(packageHelmChart)) {
      targets[build].options.additionalTargets.push(packageHelmChart);
    }
  }

  const sortetTargetKeys = _.keys(targets).sort();

  return _.object(
    sortetTargetKeys,
    sortetTargetKeys.map((key) => targets[key])
  );
}

function getCopyHelmValuesName(targets: {
  [targetName: string]: TargetConfiguration;
}): string {
  const build = 'build';
  const copyHelmValues = 'copyHelmValues';
  const targetKeys = _.keys(targets);

  if (targetKeys.includes(copyHelmValues)) return copyHelmValues;

  const containsBuild = _.keys(targets).includes(build);

  return containsBuild ? copyHelmValues : build;
}
