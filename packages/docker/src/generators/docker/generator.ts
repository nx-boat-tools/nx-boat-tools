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
  runPortsMap?: { [hostPort: number]: number };
  runVolumesMap?: { [targetName: string]: string };
  runVarables?: { [targetName: string]: string };
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

  options.baseDockerImage ??= 'nginx:latest';
  options.runVolumeMounts ??= `${projectDistPath}:/usr/share/nginx/html`;
  options.runPortMappings ??= '8080:80';

  const runPortsMap: { [hostPort: number]: number } = _.object(
    _.map(options.runPortMappings.split(','), (mapping) =>
      _.map(mapping.split(':'), (port) => +port)
    )
  );
  const runVolumesMap: { [targetName: string]: string } = _.object(
    _.map(options.runVolumeMounts.split(','), (mapping) => mapping.split(':'))
  );
  const runVarables: { [targetName: string]: string } =
    options.runVariables !== undefined
      ? _.object(
          _.map(options.runVariables.split(','), (mapping) =>
            mapping.split(':')
          )
        )
      : undefined;

  return {
    ...options,
    projectConfig,
    dockerFilePath,
    dockerIgnorePath,
    projectDistPath,
    runPortsMap,
    runVolumesMap,
    runVarables,
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

  const buildStagesToAdd = {
    dockerImage: {
      targets: [copyDockerFiles, buildDockerImage],
    } as ChainExecutorStage,
  };

  const minikubeTargets = {};
  const runOptions = {};

  if (normalizedOptions.runPortsMap !== undefined) {
    runOptions['ports'] = normalizedOptions.runPortsMap;
  }
  if (normalizedOptions.runVolumesMap !== undefined) {
    runOptions['mounts'] = normalizedOptions.runVolumesMap;
  }
  if (normalizedOptions.runVarables !== undefined) {
    runOptions['vars'] = normalizedOptions.runVarables;
  }

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
        ...runOptions
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
