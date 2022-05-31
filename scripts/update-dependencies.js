const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const _ = require('underscore');

const argv = require('minimist')(process.argv.slice(2));

const root = argv.root;
const projectDir = argv.projectDir;
const version = argv.peerVersion == 'undefined' ? undefined : argv.peerVersion;
const excludedRootDeps = argv.excludedRootDeps?.split(',') || [];
const ignoredPeerDeps = argv.ignoredPeerDeps?.split(',') || [];

const project = path.basename(projectDir);

console.log(
  `\n🆙  Updating the dependencies in package.json for project '${project}'...`
);

if (root === undefined) {
  throw new Error('You must specify the workspace root!');
}

if (projectDir === undefined) {
  throw new Error('You must specify a projectDir!');
}

const rootPackageJsonPath = path.join(root, 'package.json');
const projectPackageJsonPath = path.join(root, projectDir, 'package.json');

const rootPackageJsonString = readFileSync(rootPackageJsonPath);
const rootPackageJson = JSON.parse(rootPackageJsonString);

const rootVersion = version || `^${rootPackageJson.version}` || 'latest';
const rootDependencies = rootPackageJson.dependencies || {};
const filteredDependencies = _.omit(rootDependencies, ...excludedRootDeps);

let projectPackageJsonString = readFileSync(projectPackageJsonPath);
const projectPackageJson = JSON.parse(projectPackageJsonString);

const peerDependencies = projectPackageJson.peerDependencies || {};
const peerKeys = _.without(_.keys(peerDependencies), ...ignoredPeerDeps);

_.each(peerKeys, (dep) => {
  peerDependencies[dep] = rootVersion;
});

projectPackageJsonString = JSON.stringify(
  {
    ...projectPackageJson,
    dependencies: filteredDependencies,
    peerDependencies,
  },
  null,
  2
);

writeFileSync(projectPackageJsonPath, projectPackageJsonString);
