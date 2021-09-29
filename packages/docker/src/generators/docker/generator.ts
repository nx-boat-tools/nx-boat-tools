import {
  formatFiles,
  generateFiles,
  names,
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import * as path from 'path';
import _ = require('underscore');
import { DockerGeneratorSchema } from './schema';

interface NormalizedSchema extends DockerGeneratorSchema {
  projectConfig: any;
  projectDistPath: string;
}

function normalizeOptions(
  tree: Tree,
  options: DockerGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.name);
  const projectDistPath = path.join('dist', projectConfig.root);

  if (projectConfig.targets.buildDocker) {
    throw new Error(`${options.name} already has a buildDocker target.`);
  }

  return {
    ...options,
    projectConfig,
    projectDistPath,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    dot: '.',
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectConfig.root,
    templateOptions
  );
}

export default async function (tree: Tree, options: DockerGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const copyTargetName = getCopyTargetName(
    normalizedOptions.projectConfig.targets
  );

  const mounts: any = {};
  mounts[normalizedOptions.projectDistPath] = '/usr/share/nginx/html';

  const targets = {
    ...normalizedOptions.projectConfig.targets,
    buildDockerImage: {
      executor: '@nx-boat-tools/docker:build',
      options: {
        buildPath: normalizedOptions.projectDistPath,
      },
    },
    publishDockerImage: {
      executor: '@nx-boat-tools/docker:publish',
      options: {
        buildPath: normalizedOptions.projectDistPath,
        dockerRepoOrUser: normalizedOptions.dockerRepoOrUser,
      },
    },
    runDockerImage: {
      executor: '@nx-boat-tools/docker:run',
      options: {
        ports: {
          8080: 80,
        },
        mounts,
      },
    },
  };
  targets[copyTargetName] = {
    executor: '@nx-boat-tools/docker:copyFiles',
    options: {
      distPath: normalizedOptions.projectDistPath,
    },
  };

  if (copyTargetName !== 'build') {
    if (targets.build?.executor === '@nx-boat-tools/common:chain-execute') {
      if (!targets.build.options.targets.includes(copyTargetName)) {
        targets.build.options.targets.push(copyTargetName);
      }
    } else {
      if (targets.build !== undefined) {
        targets.buildSrc = targets.build;
      }

      targets.build = {
        executor: '@nx-boat-tools/common:chain-execute',
        options: {
          targets: ['buildSrc', copyTargetName],
        },
      };
    }
  }

  const sortetTargetKeys = _.keys(targets).sort();

  updateProjectConfiguration(tree, options.name, {
    ...normalizedOptions.projectConfig,
    targets: _.object(
      sortetTargetKeys,
      sortetTargetKeys.map((key) => targets[key])
    ),
  });
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}

function getCopyTargetName(targets: any): string {
  const build = 'build';
  const copyDockerFiles = 'copyDockerFiles';
  const targetKeys = _.keys(targets);

  if (targetKeys.includes(copyDockerFiles)) return copyDockerFiles;

  const containsBuild = _.keys(targets).includes(build);

  return containsBuild ? copyDockerFiles : build;
}
