import path = require('path');
import _ = require('underscore');

export function getHelmAppendedBuildTargets(
    projectDistPath: string,
    projectHelmPath: string,
    projectConfig: any,
    addPackageTarget: boolean = false
): any {
    const copyHelmValues = 'copyHelmValues';
    const packageHelmChart = 'packageHelmChart';

    const targets = {
        ...projectConfig.targets,
        copyHelmValues: {
            executor: '@nx-boat-tools/helm:copyValues',
            options: {
                projectHelmPath: projectHelmPath,
                outputPath: path.join(projectDistPath, 'helm', 'values')
            }
        }
    };

    if (addPackageTarget) {
        targets[packageHelmChart] = {
            executor: '@nx-boat-tools/helm:package',
            options: {
                projectHelmPath: projectHelmPath,
                outputPath: path.join(projectDistPath, 'helm', 'chart')
            }
        };
    }

    if (targets.build?.executor === '@nx-boat-tools/common:chain-execute') {
        if (!targets.build.options.targets.includes(copyHelmValues)) {
            targets.build.options.targets.push(copyHelmValues);
        }
    } else {
        if (targets.build !== undefined) {
            targets.buildSrc = targets.build;
        }

        targets.build = {
            executor: '@nx-boat-tools/common:chain-execute',
            options: {
                targets: [
                    'buildSrc',
                    copyHelmValues
                ]
            }
        }
    }

    if (addPackageTarget) {
        targets.build.options.additionalTargets = targets.build.options.additionalTargets || []

        if(!targets.build.options.additionalTargets.includes(packageHelmChart)) {
            targets.build.options.additionalTargets.push(packageHelmChart);
        }
    }

    const sortetTargetKeys = _.keys(targets).sort();

    return _.object(sortetTargetKeys, sortetTargetKeys.map(key => targets[key]));
}