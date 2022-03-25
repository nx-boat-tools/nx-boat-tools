import * as _ from 'underscore';
import * as path from 'path';
import {
  ChainExecutorStage,
  appendToChainTargets,
} from '@nx-boat-tools/common';
import {
  ProjectConfiguration,
  Tree,
  formatFiles,
  generateFiles,
  names,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { DockerGeneratorSchema } from './schema';

interface NormalizedSchema extends DockerGeneratorSchema {
  projectConfig: ProjectConfiguration;
  dockerFilePath: string;
  dockerIgnorePath: string;
  projectDistPath: string;
}

function normalizeOptions(
  tree: Tree,
  options: DockerGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const dockerFilePath = path.join(projectConfig.root, 'dockerfile');
  const dockerIgnorePath = path.join(projectConfig.root, '.dockerignore');
  const projectDistPath = path.join('dist', projectConfig.root);

  if (projectConfig.targets.buildDockerImage) {
    throw new Error(
      `${options.project} already has a buildDockerImage target.`
    );
  }

  return {
    ...options,
    projectConfig,
    dockerFilePath,
    dockerIgnorePath,
    projectDistPath,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.project),
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

  const buildDockerImage = 'buildDockerImage';
  const copyDockerFiles = 'copyDockerFiles';
  const buildMinikubeImage = 'buildMinikubeImage';
  const publishDockerImage = 'publishDockerImage';

  const mounts: { [targetName: string]: string } = {};
  mounts[normalizedOptions.projectDistPath] = '/usr/share/nginx/html';

  const buildStagesToAdd = {
    dockerImage: {
      targets: [copyDockerFiles, buildDockerImage],
    } as ChainExecutorStage,
  };

  const minikubeTargets = {};

  if (options.minikube == true) {
    buildStagesToAdd['minikubeImage'] = {
      explicit: true,
      targets: [copyDockerFiles, buildMinikubeImage],
    } as ChainExecutorStage;

    minikubeTargets[buildMinikubeImage] = {
      executor: '@nx-boat-tools/docker:minikubeBuild',
      options: {
        dockerFilePath: normalizedOptions.dockerFilePath,
        buildPath: normalizedOptions.projectDistPath,
      },
    };
  }

  const targets = {
    ...appendToChainTargets(normalizedOptions.projectConfig.targets, {
      build: {
        stagesToAdd: buildStagesToAdd,
      },
      package: {
        stagesToAdd: {
          dockerImage: {
            additionalTargets: [publishDockerImage],
          } as ChainExecutorStage,
        },
      },
    }),
    [copyDockerFiles]: {
      executor: '@nx-boat-tools/docker:copyFiles',
      options: {
        dockerFilePath: normalizedOptions.dockerFilePath,
        dockerIgnorePath: normalizedOptions.dockerIgnorePath,
        distPath: normalizedOptions.projectDistPath,
      },
    },
    [buildDockerImage]: {
      executor: '@nx-boat-tools/docker:build',
      options: {
        dockerFilePath: normalizedOptions.dockerFilePath,
        buildPath: normalizedOptions.projectDistPath,
      },
    },
    [publishDockerImage]: {
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
    ...minikubeTargets,
  };

  const sortetTargetKeys = _.keys(targets).sort();

  updateProjectConfiguration(tree, options.project, {
    ...normalizedOptions.projectConfig,
    targets: _.object(
      sortetTargetKeys,
      sortetTargetKeys.map((key) => targets[key])
    ),
  });
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
