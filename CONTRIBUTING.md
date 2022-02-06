<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nx-boat-tools/nx-boat-tools/develop/images/boattools.png" 
width="100%" alt="Nx Boat Tools"></p>

<hr><br />

# Contributing to Nx Boat Tools

We'd love to have you help us with Nx Boat Tools! Please read this page for details about our codebase.

- [Project Structure](#project-structure)
- [Templates](#templates)
- [Building the Project](#building-the-project)
  - [`Running Unit Tests`](#running-unit-tests)
  - [`Makefile targets`](#makefile-targets)
  - [`Developing on Windows`](#developing-on-windows)
- [Publishing to a local registry](#publishing-to-a-local-registry)
- [Documentation Contributions](#documentation-contributions)
- [Submission Guidelines](#submission-guidelines)
  - [`Submitting an Issue`](#-submitting-an-issue)
  - [`Submitting a PR`](#-submitting-a-pr)

<hr>

## 📂  Project Structure

Nx Boat Tools was originally created using the `create-nx-plugin` initializer package and its project stucture mostly matches the generated workspace stucture listed [here](https://nx.dev/nx-plugin/overview#workspace-structure).

```
nx-boat-tools
├── e2e/
│   ├── common-e2e/··················· E2E Tests for the common plugin
│   ├── docker-e2e/··················· E2E Tests for the docker plugin
│   ├── dotnet-e2e/··················· E2E Tests for the dotnet plugin
│   └── helm-e2e/····················· E2E Tests for the helm plugin
├── packages/
│   ├── common/······················· The common plugin
│   │   ├── src/
│   │   │   ├── executors/·············· The directory containing all common executors
│   │   │   ├── utilities/·············· Helper utilities shared accross projects
│   │   │   └── index.ts················ A barrel exporting utilities for use elsewhere
│   │   ├── executors.json·············· The executor specification for the plugin
│   │   ├── generators.json············· The generator specification for the plugin
│   │   ├── jest.config.js·············· The jest config for the project
│   │   ├── package.json················ THe package.json for the plugin
│   │   ├── project.json················ THe project specification for the plugin
│   │   └── tsconfig*.json·············· The tsconfigs for the plugin
│   ├── docker/······················· The docker plugin
│   │   ├── src/
│   │   │   ├── executors/·············· The directory containing all docker executors
│   │   │   └── generators·············· The directory containing all docker generators
│   │   ├── executors.json·············· The executor specification for the plugin
│   │   ├── generators.json············· The generator specification for the plugin
│   │   ├── jest.config.js·············· The jest config for the project
│   │   ├── package.json················ THe package.json for the plugin
│   │   ├── project.json················ THe project specification for the plugin
│   │   └── tsconfig*.json·············· The tsconfigs for the plugin
│   ├── dotnet/······················· The dotnet plugin
│   │   ├── src/
│   │   │   ├── executors/·············· The directory containing all dotnet executors
│   │   │   ├── generators·············· The directory containing all dotnet generators
│   │   │   └── utilities/·············· Helper utilities for working with .Net files
│   │   ├── executors.json·············· The executor specification for the plugin
│   │   ├── generators.json············· The generator specification for the plugin
│   │   ├── jest.config.js·············· The jest config for the project
│   │   ├── package.json················ THe package.json for the plugin
│   │   ├── project.json················ THe project specification for the plugin
│   │   └── tsconfig*.json·············· The tsconfigs for the plugin
│   └── helm/························· The helm plugin
│       ├── src/
│       │   ├── executors/·············· The directory containing all helm executors
│       │   ├── generators·············· The directory containing all helm generators
│       │   └── utilities/·············· Helper utilities for helm projects
│       ├── executors.json·············· The executor specification for the plugin
│       ├── generators.json············· The generator specification for the plugin
│       ├── jest.config.js·············· The jest config for the project
│       ├── package.json················ THe package.json for the plugin
│       ├── project.json················ THe project specification for the plugin
│       └── tsconfig*.json·············· The tsconfigs for the plugin
├── scripts/
│   ├── check-lock-files.js··········· Used for enforcing consisten lock files in git hook
│   ├── commit-lint.js················ Provides more information on commit message linting
│   └── update-dependencies.js········ Updates the dependencies in a project package.json
├── templates/
│   ├── dotnet-base/
│   │   └── makefile·················· A makefile containing commands to generate dotnet
│   │                                  projects based on the args given
│   ├── dotnet-classlib/
│   │   └── makefile·················· A makefile which uses the dotnet-base makefile to
│   │                                  generate a classlib project
│   ├── dotnet-console/
│   │   └── makefile·················· A makefile which uses the dotnet-base makefile to
│   │                                  generate a console project
│   ├── dotnet-webapi/
│   │   └── makefile·················· A makefile which uses the dotnet-base makefile to
│   │                                  generate a webapi project
│   └── helm/
│       └── makefile·················· A makefile containing commands to generate a
│                                      local helm chart
├── jest*.js························ The base jest configs for the workspace
├── makefile························ The makefile containing all top-level targets
├── nx.json························· The nx specification for the workspace
├── package.json···················· The root package.json containing all dependencies
├── tsconfig.base.json·············· The base tsconfigs for the workspace
└── workspace.json·················· The workspace specification
```

## 📃  Templates

It's important to note that Nx Boat Tools uses a combination of templates that are generated from tools and that are statically defined for a plugin. To help diferenciate between the two and then merge them together, some plugins store template files one level deeper than the conventional `generators/{generator}/files` directory.

### Example:

```
dotnet/······················· The dotnet plugin
└── src/
    └── generators/
        ├── classlib/
        │   └── files/
        │       └── generated/···· Files generated by creating a classlib with the .Net CLI
        └── project
            └── files/
                └── manual/······· Files created by Nx Boat tools for .Net Projects
```

### Generated Templates

The general idea with the generated templates is that, once created, they shouldn't need to be generated unless the tool used to create them has been updated. They also are git ignored since they aren't original content to the Nx Boat Tools repo.

## 🔨  Building the Project

After cloning the project to your machine, to install the dependencies, run:

```bash
npm install
```

Then, to create the generated templates, run:

```bash
make templates
```

🚩  Note: In order to build these templates both the .Net CLI and Helm CLI need to be installed.

To build all the packages, run:

```bash
npm run build
```

### Running Unit Tests

To make sure your changes do not break any unit tests, run the following:

```bash
nx affected --target=test
```

For example, if you need to only run the tests for the docker package, run:

```bash
nx test docker
```

You can also test all projects, even unaffected, by running:

```bash
npm run test
```

### Makefile targets

This project utilizes `make` to orchestrate some of the build process, in particular for use in CI/CD. The following tarkets are defined in the top-level makefile:

#### build (default)

The `build` target represents the main build for Nx Boat Tools, utilizing Nx to only build what has changed when comparing the current commit to the base_ref.

Arguments:
| name | type | default | description |
| ----------------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `base_ref` | string | 'main' | Maps to the `base` param on `nx affected:*` commands |

Build Steps:

1. Install dependencies
2. Build the affected projects
3. Test the affected projects

#### format

The `format` target formats and lints what has changed when comparing the current commit to the base_ref.

Arguments:
| name | type | default | description |
| ----------------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `base_ref` | string | 'main' | Maps to the `base` param on `nx:format*` and `nx affected:*` commands |
| `commit` | boolean | false | Whether or not to commit the changes |
| `commit-branch` | string | 'develop' | The branch to push to when committing format changes |

Steps:

1. Install dependencies
2. Format the affected projects
3. Lint and fix the affected projects
4. Commit and push the resulting changes if requested

#### artifacts

The `artifacts` target builds the projects changed since the last tag. It then zips each resulting folder into its own zip archive in the artifacts directory. The zip archive will be suffixed with the version in the `package.json`

Arguments: N/A

Steps:

1. Install dependencies
2. Update the dependencies in each affected project's `package.json`
3. Build the affected projects
4. Zip each project's output into a zip archive using the version as a suffix

#### version

The `version` target updates the `package.json` version for the workspace and all plugins.

Arguments:
| name | type | default | description |
| ----------------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `tag` | boolean | false | Whether or not to make a git tag for the version |
| `commit` | boolean | false | Whether or not to commit the changes |
| `commit-branch` | string | 'develop' | The branch to push to when committing version changes |

Steps:

1. Install dependencies
2. Calculate the new version based off of the workspace version
3. If `tag` is true then create and push the tag
4. if `commit-branch` was specified then do a `git checkout`
5. Set the workspace version
6. Set the version for each project
7. If `commit` is true then create a commit and push

#### templates

The `templates` target creates the generated template output for some of the generators. It calls `make` on each directory in the templates folder (with the exception of `dotnet-base`)

Arguments: N/A

Steps:

1. Create a template for the `dotnet` `classlib` generator based on the output from `dotnet new classlib`
2. Create a template for the `dotnet` `console` generator based on the output from `dotnet new console`
3. Create a template for the `dotnet` `webapi` generator based on the output from `dotnet new webapi`
4. Create a template for the `helm` `local-chart` generator based on the output from `helm create`

#### local-registry-\*

These targets are used when publishing to a local registry. See the [section below](#publishing-to-a-local-registry) for more details.

### Developing on Windows

To build Nx on Windows, you need to use WSL.

- Run `npm install` in WSL. NPM will compile several dependencies. If you don't run `install` in WSL, they will be compiled for Windows.
- Run `nx affected --target=test` and other commands in WSL.

## 📦  Publishing to a local registry

To test if your changes will actually work once the changes are published,
it can be useful to publish to a local registry.

The first step is to start the local registry so it can be published to. To do this, open a terminal and run the following:

```bash
# Starts the local registry. Keep this running in the background.
make local-registry-start
```

Then, open another terminal and enter the following:

```bash
# We first need to add a user to the registry. (real credentials are not required, you just need to be logged in)
npm adduser --registry http://localhost:4873

# Now we need to tell npm and yarn to use the local registry.
# Note: This reroutes your installs to your local registry
make local-registry-enable
```

Now we need to publish the packages to the local registry. Luckily there's a make target to do this for us.

```bash
# publish what's in the dist folder to the local registry
make local-registry-publish
```

You can now install and use the packages as needed for testing. To facilitate this process, you can create a temp workspace using the local registry by using the following:

```bash
# This creates a test workspace in ./tmp/local/test that uses the local registry
make local-registry-workspace

# You can now cd into the test workspace and buld the project, etc
cd ./tmp/local-test
yarn dlx nx build my-test

```

When you're ready to revert back to using your usual registry and stop the local one, enter the following command and then close the first terminal window.

```bash
# Revert npm and yarn to use their default registries
make local-registry-disable
```

## 📝  Documentation Contributions

We would love for you to contribute to our documentation as well! Please feel welcome to submit fixes or enhancements to our existing README files and other documentation in this repo.

## 📥  Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the issue tracker. An issue for your problem may already exist and has been resolved, or the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug we need to reproduce and confirm it. Having a reproducible scenario gives us wealth of important information without going back and forth with you requiring additional information, such as:

- the output of `nx report`
- `yarn.lock` or `package-lock.json`
- and most importantly - a use-case that fails

A minimal reproduction allows us to quickly confirm a bug (or point out coding problem) as well as confirm that we are fixing the right problem. We will be insisting on a minimal reproduction in order to save maintainers time and ultimately be able to fix more bugs.

🚩  A Note from Nx: Users often find coding problems themselves while preparing a minimal repository. We understand that sometimes it might be hard to extract essentials bits of code from a larger code-base, but we really need to isolate the problem before we can fix it.

You can file new issues by filling out our [issue form](https://github.com/nx-boat-tools/nx-boat-tools/issues/new).

### <a name="submit-pr"></a> Submitting a PR

Please follow the following guidelines:

- Make sure unit tests pass (`nx affected --target=test`)
  - Target a specific project with: `nx run project:test` (i.e. `nx run helm:test` to target `packages/helm`)
  - Target a specific unit test file (i.e. `packages/helm/src/executors/copyValues/executor.spec.ts`) with `jest packages/helm/src/executors/copyValues/executor.spec.ts`
  - For more options on running tests - check `jest --help` or visit [jestjs.io](https://jestjs.io/)
  - Debug with `node --inspect-brk ./node_modules/jest/bin/jest.js build/packages/helm/src/executors/copyValues/executor.spec.js`
- Make sure you run `make format`
- Update your commit message to follow the guidelines below (use `yarn commit` to automate compliance)
  - `yarn check-commit` will check to make sure your commit messages are formatted correctly

#### Commit Message Guidelines

The commit message should follow the following format:

```plain
type(scope): subject
BLANK LINE
body
```

##### Type

The type must be one of the following:

- feat - New or improved behavior being introduced (e.g. Updating to new versions of .Net or adding a new .Net project type)
- fix - Fixes the current unexpected behavior to match expected behavior (e.g. Fixing a generator to create the proper named project)
- cleanup - Code Style changes that have little to no effect on the user (e.g. Refactoring some functions into a different file)
- docs - Changes to the documentation (e.g. Adding more details on a plugin's README)
- chore - Changes that have absolutely no effect on users (e.g. Updating the version of Nx used to build the repo)

##### Scope

The scope must be one of the following:

- common - anything specific to the common plugin
- docker - anything specific to the docker plugin
- dotnet - anything specific to the dotnet plugin
- helm - anything specific to the helm plugin
- repo - anything related to managing the Nx Boat Tools repo itself
- testing - anything testing specific (e.g., Jest or Cypress)
- misc - misc stuff

##### Subject and Body

The subject must contain a description of the change, and the body of the message contains any additional details to provide more context about the change.

Including the issue number that the PR relates to also helps with tracking.

#### Example

```plain
feat(dotnet): add a generator for grpc project type

Please add support for the grpc project type

https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-new-sdk-templates#web-others

Closes #157
```

#### Commitizen

To simplify and automate the process of committing with this format,
**Nx is a [Commitizen](https://github.com/commitizen/cz-cli) friendly repository**, just do `git add` and execute `yarn commit`.
