# Nx Boat Tools - Helm

The helm is a key tool for any boat! The `helm` plugin adds Helm support to existing Nx projects.

<hr>

- [How to install](#how-to-install)
- [Executors](#executors)
  - [`copyValues`](#copyValues)
  - [`package`](#package)
- [Generators](#generators)
  - [`local-chart`](#local-chart)
  - [`repo-chart`](#repo-chart)
  - [`local-chart-project`](#local-chart-project)
  - [`repo-chart-project`](#repo-chart-project)

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

### `installLocalChart`

Used for local helm charts, the `installLocalChart` executor runs a Helm upgrade command to install a helm chart from the filesystem.

#### Available options:

| name              | type       | default | description                                                                       |
| ----------------- | ---------- | ------- | --------------------------------------------------------------------------------- |
| `projectHelmPath` | `string`   |         | Required. The path to the helm directory of a project                             |
| `valuesFilePaths` | `string[]` |         | The path to any values files to use with the chart                                |
| `dryRun`          | `boolean`  | `false` | Whether or not to perform a dry run instead of actually installing the helm chart |

#### Example:

The following workspace configuration illustrates a possible helm `installLocalChart` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installLocalChart",
          "options": {
            "projectHelmPath": "apps/example/helm",
            "valuesFilePaths": "apps/example/helm/values.yaml"
          },
          "configurations": {
            "dev": {
              "valuesFilePaths": "apps/example/helm/values-dev.yaml"
            }
          }
        }
      }
    }
  }
}
```

To run this we just need to execute the `installHelmChart` target...

```bash
nx installHelmChart example
# OR
nx run example:installHelmChart
```

This would result in installing the helm chart located in the project's helm directory and would use the `values.yaml` values file.

### `installRepoChart`

Used for repo helm charts, the `installRepoChart` executor runs a Helm upgrade command to install a helm chart from a repository.

#### Available options:

| name              | type       | default | description                                                                       |
| ----------------- | ---------- | ------- | --------------------------------------------------------------------------------- |
| `repository`      | `string`   |         | Required. The name of the repository containing your chart                        |
| `chart`           | `string`   |         | Required. The name of the chart to use (without the repository)                   |
| `valuesFilePaths` | `string[]` |         | The path to any values files to use with the chart                                |
| `dryRun`          | `boolean`  | `false` | Whether or not to perform a dry run instead of actually installing the helm chart |

#### Example:

The following workspace configuration illustrates a possible helm `installRepoChart` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installRepoChart",
          "options": {
            "repository": "bitnami",
            "chart": "mysql",
            "valuesFilePaths": "apps/example/helm/values.yaml"
          },
          "configurations": {
            "dev": {
              "valuesFilePaths": "apps/example/helm/values-dev.yaml"
            }
          }
        }
      }
    }
  }
}
```

To run this we just need to execute the `installHelmChart` target...

```bash
nx installHelmChart example
# OR
nx run example:installHelmChart
```

This would result in installing the mysql helm chart from the bitnami helm repository and would use the `values.yaml` values file.

### `lint`

Only for local helm charts, the `lint` executor will call the helm `lint` command to verify that the chart is well-formed.

#### Available options:

| name              | type     | default | description                                           |
| ----------------- | -------- | ------- | ----------------------------------------------------- |
| `projectHelmPath` | `string` |         | Required. The path to the helm directory of a project |

#### Example:

The following workspace configuration illustrates a possible helm `lint` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "lintHelmChart": {
          "executor": "@nx-boat-tools/helm:lint",
          "options": {
            "projectHelmPath": "apps/example/helm"
          }
        }
      }
    }
  }
}
```

To verify the local helm chart, we just need to execute the `lintHelmChart` target...

```bash
nx lintHelmChart example
# OR
nx run lintHelmChart:package
```

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

### `portForward`

The `portForward` executor will run a `kubectl portForward` command so the helm chart can be tested locally.

#### Available options:

| name            | type      | default | description                                     |
| --------------- | --------- | ------- | ----------------------------------------------- |
| `resourceName`  | `string`  |         | Required. The kubernetes resource to forward to |
| `hostPort`      | `integer` |         | Required. The port to map to on the host        |
| `containerPort` | `integer` |         | Required. The port exposed by the container     |

#### Example:

The following workspace configuration illustrates a possible helm `portForward` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "portForwardToMinikube": {
          "executor": "@nx-boat-tools/helm:portForward",
          "options": {
            "resourceName": "service/example/",
            "hostPort": 8080,
            "containerPort": 80
          }
        }
      }
    }
  }
}
```

To create the chart archive file we just need to execute the `portForwardToMinikube` target...

```bash
nx portForwardToMinikube example
# OR
nx run example:portForwardToMinikube
```

Both of the above would allow the service to be accessed via `http://localhost:8080`

### `uninstall`

The `uninstall` executor will call the helm `uninstall` command to remove the helm deployment for the project.

#### Available options:

| name     | type      | default | description                                                                       |
| -------- | --------- | ------- | --------------------------------------------------------------------------------- |
| `dryRun` | `boolean` | `false` | Whether or not to perform a dry run instead of actually installing the helm chart |

#### Example:

The following workspace configuration illustrates a possible helm `uninstall` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "uninstallHelmChart": {
          "executor": "@nx-boat-tools/helm:uninstall"
        }
      }
    }
  }
}
```

To verify the local helm chart, we just need to execute the `uninstallHelmChart` target...

```bash
nx uninstallHelmChart example
# OR
nx run uninstallHelmChart:package
```

## ✍️  Generators

### `local-chart`

The `local-chart` generator is for creating a local helm chart for an existing project.

#### Available options:

| name               | type      | default     | description                                                                                                                                                |
| ------------------ | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project`          | `string`  |             | Required. The name of the project to add helm to.                                                                                                          |
| `createValues`     | `boolean` | `true`      | Whether or not to copy the values file from the chart to use for deployment                                                                                |
| `environments`     | `string?` | `undefined` | When `createValues` is set to `true`, this is a comma seperated list of environment names that can be used to create a copy for each environment specified |
| `runBuildTarget`   | `string`  |             | An optional build target to call before running the helm chart                                                                                             |
| `runResourceName`  | `string`  |             | The name of the resource to port-forward to within minikube)                                                                                               |
| `runHostPort`      | `number`  |             | The host port to use when port-forwarding to minikube                                                                                                      |
| `runContainerPort` | `number`  |             | The container port to use when port-forwarding to minikube                                                                                                 |

#### Generated files:

The generated files should mostly reflect the same files you'd get from running `helm create`. A helm folder is added within the project directory and it will contain the chart directory and as well as any values files that were created.

#### Updates to project configuration:

The project's entry in the project configuration will be updated as follows:

- `build` - If a `build` target existed previously then it will be renamed to to `buildSrc`. A new `build` will then be added and is a `chain-execute` with the following stages and targets:

  🚩  Note: If no `build` target exists before running the `local-chart` generator the no root stage will be added.

  - The `root` stage:
    - `buildSrc` - This is the previous build target and we want it to run first
  - The `helmChart` stage:
    - `lintHelmChart` - This calls the docker `lint` target to test the helm chart

- `package` - If a `package` target existed previously then it will be renamed to to `packageSrc`. A new `package` will then be added and is a `chain-execute` with the following stages and targets:

  🚩  Note: If no `package` target exists before running the `local-chart` generator the no root stage will be added.

  - The `root` stage:
    - `packageSrc` - This is the previous package target and we want it to run first
  - The `helmChart` stage:
    - `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.
    - `packageHelmChart` - this calls the helm `package` executor to create a chart archive file in the dist directory

- `runHelmChart` - this calls a `chain-execute` with the following stages and targets:

  - The `build` stage (only if a build target was specified):
    - The build target specified is added as a regular target of the stage.
  - The `root` stage:
    - `installHelmChart` - This calls the helm `installLocalChart` target to install the helm chart into kubernetes
    - `portForwardToMinikube` - this calls the helm `portForward` executor to allow the chart to be tested locally
    - `uninstallHelmChart` - this calls the helm `uninstall` executor to uninstall the chart from kubernetes

  ℹ️  Since the build target is added as a regular target to a `build stage` and all run targets are added as post targets on the `root` stage, the build target will always run first.

The following is a full example of what's added to the project configuration for a project when adding helm to it:

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
            "targets": ["buildSrc"],
            "stages": {
              "helmChart": {
                "targets": ["lintHelmChart"]
              }
            }
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
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installLocalChart",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "valuesFilePaths": ["apps/my-app/helm/values.yaml"]
          }
        },
        "lintHelmChart": {
          "executor": "@nx-boat-tools/helm:lint",
          "options": {
            "projectHelmPath": "apps/my-app/helm"
          }
        },
        "package": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["packageSrc"],
            "stages": {
              "helmChart": {
                "targets": ["copyHelmValues", "packageHelmChart"]
              }
            }
          }
        },
        "packageHelmChart": {
          "executor": "@nx-boat-tools/helm:package",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/chart"
          }
        },
        "packageSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "portForwardToMinikube": {
          "executor": "@nx-boat-tools/helm:portForward",
          "options": {
            "resourceName": "service/my-app",
            "hostPort": 8080,
            "containerPort": 80
          }
        },
        "runHelmChart": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "postTargets": [
              "installHelmChart",
              "portForwardToMinikube",
              "uninstallHelmChart"
            ]
          }
        },
        "uninstallHelmChart": {
          "executor": "@nx-boat-tools/helm:uninstall",
          "options": {}
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `local-chart` to a project

The following illustrates how to add a local helm chart to a project:

```bash
#Add a helm chart to a project named my-project with a single values file, values.yaml
nx g @nx-dev-tools/helm:local-chart --project=my-project --createValues=true

#Add a helm chart to a project named my-project with two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:local-chart --project=my-project --createValues=true --environments=dev,prod
```

### `repo-chart`

The `repo-chart` generator is for adding a helm chart from a repository to your project.

#### Available options:

| name               | type      | default     | description                                                                                                          |
| ------------------ | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `project`          | `string`  |             | Required. The name of the project to add helm to.                                                                    |
| `repository`       | `string`  |             | Required. The name of the repository containing the chart                                                            |
| `chart`            | `string`  |             | Required. The name of the chart to use (without the repository)                                                      |
| `environments`     | `string?` | `undefined` | This is a comma seperated list of environment names that can be used to create a copy for each environment specified |
| `runBuildTarget`   | `string`  |             | An optional build target to call before running the helm chart                                                       |
| `runResourceName`  | `string`  |             | The name of the resource to port-forward to within minikube)                                                         |
| `runHostPort`      | `number`  |             | The host port to use when port-forwarding to minikube                                                                |
| `runContainerPort` | `number`  |             | The container port to use when port-forwarding to minikube                                                           |

#### Generated files:

A helm folder is added within the project directory containing the values files that were created.

#### Updates to project configuration:

The project's entry in the project configuration will be updated as follows:

- `package` - If a `package` target existed previously then it will be renamed to to `packageSrc`. A new `package` will then be added and is a `chain-execute` with the following stages and targets:

  🚩  Note: If no `package` target exists before running the `repo-chart` generator the no root stage will be added.

  - The `root` stage:
    - `packageSrc` - This is the previous package target and we want it to run first
  - The `helmChart` stage:
    - `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.

- `runHelmChart` - this calls a `chain-execute` with the following stages and targets:

  - The `build` stage (only if a build target was specified):
    - The build target specified is added as a regular target of the stage.
  - The `root` stage:
    - `installHelmChart` - This calls the helm `installRepoChart` target to install the helm chart into kubernetes
    - `portForwardToMinikube` - this calls the helm `portForward` executor to allow the chart to be tested locally
    - `uninstallHelmChart` - this calls the helm `uninstall` executor to uninstall the chart from kubernetes

  ℹ️  Since the build target is added as a regular target to a `build stage` and all run targets are added as post targets on the `root` stage, the build target will always run first.

The following is a full example of what's added to the project configuration for a project when adding helm to it:

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
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installRepoChart",
          "options": {
            "repository": "bitnami",
            "chart": "mysql",
            "valuesFilePaths": ["apps/my-app/helm/values.yaml"]
          }
        },
        "package": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["packageSrc"],
            "stages": {
              "helmChart": {
                "targets": ["copyHelmValues"]
              }
            }
          }
        },
        "packageSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "portForwardToMinikube": {
          "executor": "@nx-boat-tools/helm:portForward",
          "options": {
            "resourceName": "service/my-app",
            "hostPort": 8080,
            "containerPort": 80
          }
        },
        "runHelmChart": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "postTargets": [
              "installHelmChart",
              "portForwardToMinikube",
              "uninstallHelmChart"
            ]
          }
        },
        "uninstallHelmChart": {
          "executor": "@nx-boat-tools/helm:uninstall",
          "options": {}
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `repo-chart` to a project

The following illustrates how to add a support for a remote helm chart to a project:

```bash
#Add a helm chart to a project named my-project with a single values file, values.yaml
nx g @nx-dev-tools/helm:repo-chart --project=my-project --repo=bitnami --chart=mysql

#Add a helm chart to a project named my-project with two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:repo-chart --project=my-project --repo=bitnami --chart=mysql --environments=dev,prod
```

### `local-chart-project`

The `local-chart-project` generator is for creating new project containing a local helm chart.

#### Available options:

| name               | type      | default               | description                                                                                                                                                                                                                   |
| ------------------ | --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. The name of the project that's being created.                                                                                                                                                                       |
| `tags`             | `string?` | `undefined`           | Tags to be used when adding the project to the `workspace.json`. More information about tags can be found [here](https://nx.dev/l/a/structure/monorepo-tags)                                                                  |
| `directory`        | `string?` | `undefined`           | This can be used to nest the project into additional folders inside of the `apps` or `libs` folder. Insead of going to `apps/{projectName}`, for example, the project can be created at `apps/{directoryValue}/{projectName}` |
| `createValues`     | `boolean` | `true`                | Whether or not to copy the values file from the chart to use for deployment                                                                                                                                                   |
| `environments`     | `string?` | `undefined`           | When `createValues` is set to `true`, this is a comma seperated list of environment names that can be used to create a copy for each environment specified                                                                    |
| `standaloneConfig` | `boolean` | the workspace default | Should the project use package.json? If false, the project config is inside workspace.json                                                                                                                                    |
| `runBuildTarget`   | `string`  |                       | An optional build target to call before running the helm chart                                                                                                                                                                |
| `runResourceName`  | `string`  |                       | The name of the resource to port-forward to within minikube)                                                                                                                                                                  |
| `runHostPort`      | `number`  |                       | The host port to use when port-forwarding to minikube                                                                                                                                                                         |
| `runContainerPort` | `number`  |                       | The container port to use when port-forwarding to minikube                                                                                                                                                                    |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `helm create`. The project will contain a helm folder which will contain the chart directory and as well as any values files that were created.

#### Updates to project configuration:

The project is added to the project configuration with the following high-level targets defined:

- `build` - This calls a `chain-execute` with the following stages and targets:

  - The `helmChart` stage:
    - `lintHelmChart` - This calls the docker `lint` target to test the helm chart

- `package` - This calls a `chain-execute` with the following stages and targets:

  - The `helmChart` stage:
    - `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.
    - `packageHelmChart` - this calls the helm `package` executor to create a chart archive file in the dist directory

- `runHelmChart` - this calls a `chain-execute` with the following stages and targets:

  - The `build` stage (only if a build target was specified):
    - The build target specified is added as a regular target of the stage.
  - The `root` stage:
    - `installHelmChart` - This calls the helm `installLocalChart` target to install the helm chart into kubernetes
    - `portForwardToMinikube` - this calls the helm `portForward` executor to allow the chart to be tested locally
    - `uninstallHelmChart` - this calls the helm `uninstall` executor to uninstall the chart from kubernetes

  ℹ️  Since the build target is added as a regular target to a `build stage` and all run targets are added as post targets on the `root` stage, the build target will always run first.

- `version` - This updates the project version utilizing the [@jscutlery/semver](https://github.com/jscutlery/semver) community plugin.

The following is a full example of what's added to the project configuration when adding a helm local-chart project:

```jsonc
//workspace.json

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
            "stages": {
              "helmChart": {
                "targets": ["lintHelmChart"]
              }
            }
          }
        },
        "copyHelmValues": {
          "executor": "@nx-boat-tools/helm:copyValues",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/values"
          }
        },
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installLocalChart",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "valuesFilePaths": ["apps/my-app/helm/values.yaml"]
          }
        },
        "lintHelmChart": {
          "executor": "@nx-boat-tools/helm:lint",
          "options": {
            "projectHelmPath": "apps/my-app/helm"
          }
        },
        "package": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "stages": {
              "helmChart": {
                "targets": ["copyHelmValues", "packageHelmChart"]
              }
            }
          }
        },
        "packageHelmChart": {
          "executor": "@nx-boat-tools/helm:package",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/chart"
          }
        },
        "portForwardToMinikube": {
          "executor": "@nx-boat-tools/helm:portForward",
          "options": {
            "resourceName": "service/my-app",
            "hostPort": 8080,
            "containerPort": 80
          }
        },
        "runHelmChart": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "postTargets": [
              "installHelmChart",
              "portForwardToMinikube",
              "uninstallHelmChart"
            ]
          }
        },
        "uninstallHelmChart": {
          "executor": "@nx-boat-tools/helm:uninstall",
          "options": {}
        },
        "version": {
          "executor": "@@jscutlery/semver:version",
          "options": {
            "commitMessageFormat": "chore(${projectName}): release version ${version}"
          }
        }
      },
      "tags": ""
    }
  }
}
```

#### Using `local-chart-project` to create a project

The following illustrates how to create a local helm chart project:

```bash
#Create a project named my-project with a local helm chart and a single values file, values.yaml
nx g @nx-dev-tools/helm:local-chart-project my-project --createValues=true

#Create a project named my-project with a local helm chart and two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:local-chart-project my-project --createValues=true --environments=dev,prod
```

### `repo-chart-project`

The `repo-chart-project` generator is for creating new project utilizing a helm chart from a repository.

#### Available options:

| name               | type      | default               | description                                                                                                                                                                                                                   |
| ------------------ | --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. The name of the project that's being created.                                                                                                                                                                       |
| `tags`             | `string?` | `undefined`           | Tags to be used when adding the project to the `workspace.json`. More information about tags can be found [here](https://nx.dev/l/a/structure/monorepo-tags)                                                                  |
| `directory`        | `string?` | `undefined`           | This can be used to nest the project into additional folders inside of the `apps` or `libs` folder. Insead of going to `apps/{projectName}`, for example, the project can be created at `apps/{directoryValue}/{projectName}` |
| `repository`       | `string`  |                       | Required. The name of the repository containing the chart                                                                                                                                                                     |
| `chart`            | `string`  |                       | Required. The name of the chart to use (without the repository)                                                                                                                                                               |
| `environments`     | `string?` | `undefined`           | This is a comma seperated list of environment names that can be used to create a copy for each environment specified                                                                                                          |
| `standaloneConfig` | `boolean` | the workspace default | Should the project use package.json? If false, the project config is inside workspace.json                                                                                                                                    |
| `runBuildTarget`   | `string`  |                       | An optional build target to call before running the helm chart                                                                                                                                                                |
| `runResourceName`  | `string`  |                       | The name of the resource to port-forward to within minikube)                                                                                                                                                                  |
| `runHostPort`      | `number`  |                       | The host port to use when port-forwarding to minikube                                                                                                                                                                         |
| `runContainerPort` | `number`  |                       | The container port to use when port-forwarding to minikube                                                                                                                                                                    |

#### Generated files:

Other than the addition of a `package.json` file for the project, a helm folder is added within the project directory containing the values files that were created.

#### Updates to project configuration:

The project is added to the project configuration with the following high-level targets defined:

- `package` - This calls a `chain-execute` with the following stages and targets:

  - The `helmChart` stage:
    - `copyHelmValues` - This calls the helm `copyValues` target to copy any values files to the dist directory.

- `runHelmChart` - this calls a `chain-execute` with the following stages and targets:

  - The `build` stage (only if a build target was specified):
    - The build target specified is added as a regular target of the stage.
  - The `root` stage:
    - `installHelmChart` - This calls the helm `installRepoChart` target to install the helm chart into kubernetes
    - `portForwardToMinikube` - this calls the helm `portForward` executor to allow the chart to be tested locally
    - `uninstallHelmChart` - this calls the helm `uninstall` executor to uninstall the chart from kubernetes

  ℹ️  Since the build target is added as a regular target to a `build stage` and all run targets are added as post targets on the `root` stage, the build target will always run first.

- `version` - This updates the project version utilizing the [@jscutlery/semver](https://github.com/jscutlery/semver) community plugin.

The following is a full example of what's added to the project configuration when adding a helm repo-chart project:

```jsonc
//workspace.json

{
  //...
  "projects": {
    "my-app": {
      "root": "apps/my-app",
      "projectType": "application",
      "sourceRoot": "apps/my-app/src",
      "targets": {
        "copyHelmValues": {
          "executor": "@nx-boat-tools/helm:copyValues",
          "options": {
            "projectHelmPath": "apps/my-app/helm",
            "distPath": "dist/apps/my-app/helm/values"
          }
        },
        "installHelmChart": {
          "executor": "@nx-boat-tools/helm:installRepoChart",
          "options": {
            "repository": "bitnami",
            "chart": "mysql",
            "valuesFilePaths": ["apps/my-app/helm/values.yaml"]
          }
        },
        "package": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "stages": {
              "helmChart": {
                "targets": ["copyHelmValues"]
              }
            }
          }
        },
        "portForwardToMinikube": {
          "executor": "@nx-boat-tools/helm:portForward",
          "options": {
            "resourceName": "service/my-app",
            "hostPort": 8080,
            "containerPort": 80
          }
        },
        "runHelmChart": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "postTargets": [
              "installHelmChart",
              "portForwardToMinikube",
              "uninstallHelmChart"
            ]
          }
        },
        "uninstallHelmChart": {
          "executor": "@nx-boat-tools/helm:uninstall",
          "options": {}
        },
        "version": {
          "executor": "@@jscutlery/semver:version",
          "options": {
            "commitMessageFormat": "chore(${projectName}): release version ${version}"
          }
        }
      },
      "tags": ""
    }
  }
}
```

#### Using `repo-chart-project` to create a project

The following illustrates how to create a repository helm chart project:

```bash
#Create a project named my-project with a repo helm chart and a single values file, values.yaml
nx g @nx-dev-tools/helm:repo-chart-project my-project --createValues=true

#Create a project named my-project with a repo helm chart and two values files, values-dev.yaml and values-prod.yaml
nx g @nx-dev-tools/helm:repo-chart-project my-project --createValues=true --environments=dev,prod
```
