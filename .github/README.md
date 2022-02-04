# Nx Boat Tools - Github



## 📂  Folder Structure

The `.github` folder contains various configurations and templates for use in the [Nx Boat Tools repository](https://github.com/nx-boat-tools/nx-boat-tools)

```
.github
├── ISSUE_TEMPLATE/················· Files related to github issues
│   ├── *.md·························· Different issue templates
│   └── config.yml···················· Config settings for the new issue page and form
├── workflows/······················ Definitions for github actions
├── CODEOWNERS······················ Code owner assignments
├── dependabot.yml·················· Dependabot configuration
├── PULL_REQUEST_TEMPLATE.md········ The pull request template
└── SAVED_REPLIES.md················ Canned responses for use with submitted issues
```

## 🏃  Workflows

The following GitHub Actions are defined for [Nx Boat Tools](https://github.com/nx-boat-tools/nx-boat-tools)

### Pull Request

The Pull Request action is triggered when a pull request is created or when any new commit is pushed to a pull request against the `develop` branch. It is responsible for performing various checks on the PR, namely that it builds, that tests pass, and the code coverage critera is met.

This action also formats and lints affected files. If any changes result, it will automatically commit those changes to the PR.

🚧 Refactor Note 🚧 

Main is currently in the definition strictly for testing purposes

### Build

The Build action is triggered when a commit is pushed to either the `develop` or `main` branches. Its purpose is to ensure that those branches are healthy and to alert if problems are found. It does that by building the projects affected since the last commit to main, performing tests on them, and checking code coverage.

🚧 Refactor Note 🚧 

I'm not sure main makes sense here... this probably should only be for develop as I don't think the "projects affected since the last commit to main" would work properly or would even make sense in that case

### Merge

The Merge action takes place when a commit is pushed to the `main` branch. It first creates the build artifacts by building the projects affected since the last version. It then zips each project folder into a zip archive artifact. It then creates a draft release for the project and uploads each zip archive as an asset.

After the artifacts are created, this action also bumps the version and pushes the change to the `develop` branch. The idea is that you're working on the next version from that point forward.

### Release

The Release action takes place when a release is published for the project. It downloads the zipped assets for each project on the release, unzips them, and publishes them to npm.
