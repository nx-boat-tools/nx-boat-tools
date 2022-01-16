# Nx Boat Tools - Helm

The helm is a key tool for any boat! The `helm` plugin adds Helm support to existing Nx projects.

<hr>

- [How to install](#how-to-install)
- [Executors](#executors)
  - [`copyValues`](#copyValues)
  - [`package`](#package)
- [Generators](#generators)
  - [`helm-local`](#helm-local)
  - [`helm-repo`](#helm-repo)

<hr>

## 💡  How to install

```bash
npm install -D @nx-boat-tools/helm

# OR

yarn add -D @nx-boat-tools/helm
```

## 🏃  Executors

### `copyValues`

The `copyValues` executor copies all of the values files in the helm directory of a project to the project's dist directory.

#### Available options:

| name              | type     | default | description                                                                       |
| ----------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `projectHelmPath` | `string` |         | Required. The path to the helm directory of a project                             |
| `outputPath`      | `string` |         | Required. The dist path of the project where the values files should be copied to |

#### Example:

The following workspace configuration illustrates a possible helm `copyValues` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "copyHelmValues": {
          "executor": "@nx-boat-tools/helm:copyValues",
          "options": {
            "projectHelmPath": "apps/example/helm",
            "outputPath": "dist/apps/example/helm/values"
          }
        }
      }
    }
  }
}
```

To run this we just need to execute the `copyHelmValues` target...

```bash
nx copyHelmValues example
# OR
nx run example:copyHelmValues
```

This would result in copying the all the values files from `apps/example/helm` to `dist/apps/example/helm/values`. This will not include `apps/example/helm/chart` or any other nested folders in the project helm directory

### `package`

Only for local helm charts, the `package` executor will call the helm `package` command to create a versioned chart archive file.

#### Available options:

| name              | type     | default | description                                                                           |
| ----------------- | -------- | ------- | ------------------------------------------------------------------------------------- |
| `projectHelmPath` | `string` |         | Required. The path to the helm directory of a project                                 |
| `outputPath`      | `string` |         | Required. The dist path of the project where the chart archive file should be created |

#### Example:

The following workspace configuration illustrates a possible helm `package` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "package": {
          "executor": "@nx-boat-tools/helm:package",
          "options": {
            "projectHelmPath": "apps/example/helm",
            "outputPath": "dist/apps/example/helm/chart"
          }
        }
      }
    }
  }
}
```

To create the chart archive file we just need to execute the `package` target...

```bash
nx package example
# OR
nx run example:package
```

Both of the above would result in a chart archive file being created at `dist/apps/example/helm/chart/example-X.X.X.tgz` where `X.X.X` is the versions specified in the project's `package.json`. If no version exists then the filename would just be `dist/apps/example/helm/chart/example.tgz`

## ✍️  Generators

### `helm-local`

The `helm-local` generator is for creating a local helm chart for your project.

#### Available options:

| name           | type      | default     | description                                                                                                                                                |
| -------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project`      | `string`  |             | Required. The name of the project to add helm to.                                                                                                          |
| `createValues` | `boolean` | `true`      | Whether or not to copy the values file from the chart to use for deployment                                                                                |
| `environments` | `string?` | `undefined` | When `createValues` is set to `true`, this is a comma seperated list of environment names that can be used to create a copy for each environment specified |

#### Generated files:

The generated files should mostly reflect the same files you'd get from running `helm create`. A helm folder is added within the project directory and it will contain the chart directory and as well as any values files that were created.

#### Updates to `workspace.json`:

The project's entry in the `workspace.json` will be updated as follows:

- `build` - If a `build` target existed previously then it will be renamed to to `buildSrc`. A new `build` will then be added and is a `chain-execute` which calls the following targets:
  - `buildSrc` - This is the previous build target and we want it to run first
  - `copyHelmValues` - Then we want to copy any values files to the dist directory

🚧  This needs to be refactored  🚧
This currently adds the `packageHelmChart` target to the `additionalTargets` param directly but it should be in the `configurations` section for `prod`

- `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.
- `packageHelmChart` - this calls the helm `package` executor to create a chart archive file in the dist directory

The following is a full example of what's added to the `workspace.json` for a project when adding helm to it:

```jsonc
//workspace.json BEFORE

{
  //...
  "projects": {
    "my-app": {
      "root": "apps/my-app",
      "projectType": "application",
      "sourceRoot": "apps/my-app/src",
      "targets": {
        "build": {
          "executor": "@nrwl/node:package"
          //...
        }
      },
      "tags": ""
    }
  }
}
```

```jsonc
//workspace.json AFTER

{
  //...
  "projects": {
    "my-app": {
      "root": "apps/my-app",
      "projectType": "application",
      "sourceRoot": "apps/my-app/src",
      "targets": {
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["buildSrc", "copyHelmValues"],
            "additionalTargets": ["packageHelmChart"]
          }
        },
        "buildSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "copyHelmValues": {
          "executor": "@nx-boat-tools/helm:copyValues",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/values"
          }
        },
        "packageHelmChart": {
          "executor": "@nx-boat-tools/helm:package",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/chart"
          }
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `helm-local` to a project

The following illustrates how to add a local helm chart to a project:

```bash
#Add a helm chart to a project named my-project with a single values file, values.yaml
nx g @nx-dev-tools/helm:helm-local my-project --createValues=true

#Add a helm chart to a project named my-project with two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:helm-local my-project --createValues=true --environments=dev,prod
```

### `helm-repo`

The `helm-repo` generator is for creating a local helm chart for your project.

#### Available options:

| name           | type      | default     | description                                                                                                          |
| -------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `project`      | `string`  |             | Required. The name of the project to add helm to.                                                                    |
| `repository`   | `string`  |             | Required. The name of the repository containing the chart                                                            |
| `chart`        | `string`  |             | Required. The name of the chart to use (without the repository)                                                      |
| `environments` | `string?` | `undefined` | This is a comma seperated list of environment names that can be used to create a copy for each environment specified |

#### Generated files:

A helm folder is added within the project directory and it the values files that were created.

#### Updates to `workspace.json`:

The project's entry in the `workspace.json` will be updated as follows:

- `build` - If a `build` target existed previously then it will be renamed to to `buildSrc`. A new `build` will then be added and is a `chain-execute` which calls the following targets:
  - `buildSrc` - This is the previous build target and we want it to run first
  - `copyHelmValues` - Then we want to copy any values files to the dist directory
- `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.

The following is a full example of what's added to the `workspace.json` for a project when adding helm to it:

```jsonc
//workspace.json BEFORE

{
  //...
  "projects": {
    "my-app": {
      "root": "apps/my-app",
      "projectType": "application",
      "sourceRoot": "apps/my-app/src",
      "targets": {
        "build": {
          "executor": "@nrwl/node:package"
          //...
        }
      },
      "tags": ""
    }
  }
}
```

```jsonc
//workspace.json AFTER

{
  //...
  "projects": {
    "my-app": {
      "root": "apps/my-app",
      "projectType": "application",
      "sourceRoot": "apps/my-app/src",
      "targets": {
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["buildSrc", "copyHelmValues"]
          }
        },
        "buildSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "copyHelmValues": {
          "executor": "@nx-boat-tools/helm:copyValues",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/values"
          }
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `helm-repo` to a project

The following illustrates how to add a support for a remote helm chart to a project:

```bash
#Add a helm chart to a project named my-project with a single values file, values.yaml
nx g @nx-dev-tools/helm:helm-repo my-project --repo=bitnami --chart=mysql

#Add a helm chart to a project named my-project with two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:helm-repo my-project --repo=bitnami --chart=mysql --environments=dev,prod
```
