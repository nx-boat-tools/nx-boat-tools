# Nx Boat Tools - .Net

Every boat needs a dock! The `docker` plugin adds Docker support to existing Nx projects.

<hr>

- [Why not use the community `nx-docker` plugin](#why-not-use-the-community-nx-docker-plugin)
- [How to install](#how-to-install)
- [Executors](#executors)
  - [`build`](#build)
  - [`copyFiles`](#copyFiles)
  - [`publish`](#publish)
  - [`run`](#run)
- [Generators](#generators)
  - [`docker`](#docker)

<hr>

## Why not use [the community `nx-docker` plugin](https://github.com/gperdomor/nx-tools/tree/main/packages/nx-docker)?

The `nx-docker` plugin is a more mature plugin and definetly has its benefits. It uses [Buildx](https://github.com/docker/buildx) and supports various options such as multi-platform builds, secrets, and remote cache. Nx Boat Tools instead tries to keep things simpler and just interacts with the Docker CLI. Also, by default, Nx Boat Tools uses the dist directory of a project as its working directory for docker commands as that is where the files that will be copied into docker usually are located.

## 💡  How to install

```bash
npm install -D @nx-boat-tools/docker

# OR

yarn add -D @nx-boat-tools/docker
```

## 🏃  Executors

### `build`

The `build` executor builds a docker image from a `dockerfile` for a given project. It tags the image as both `latest` and the version in the project's `package.json`.

#### 🚩  Note:

If no `package.json` exists for the project or it does not specify a version then only `latest` will be tagged.

#### 🚩  Note:

The `buildPath` is set to the dist directory of a project by default as that is where the files that will be copied into docker usually are located. This means that the `copyFiles` executor needs to have ran first as well as any other executors producing build output that needs to be copied into

#### Available options:

| name             | type     | default                   | description                                    |
| ---------------- | -------- | ------------------------- | ---------------------------------------------- |
| `buildPath`      | `string` |                           | Required. The path to pass to the docker build |
| `dockerFilePath` | `string` | `${buildPath}/dockerfile` | The path to the dockerfile for the project.    |

#### Example:

The following workspace configuration illustrates a possible docker `build` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "build": {
          "executor": "@nx-boat-tools/docker:build",
          "options": {
            "dockerFilePath": "apps/example/dockerfile",
            "buildPath": "apps/example"
          }
        }
      }
    }
  }
}
```

To build our docker image we just need to execute the `build` target...

```bash
nx build example
# OR
nx run example:build
```

Both of the above would result in a docker image being built that's named `example` and would be tagged with `latest` and the version in the `package.json`

### `copyFiles`

The `copyFiles` executor copies the `dockerfile` and `.dockerignore` file (if one exists) to the dist directory of a project.

#### Available options:

| name               | type     | default                     | description                                                                |
| ------------------ | -------- | --------------------------- | -------------------------------------------------------------------------- |
| `distPath`         | `string` |                             | Required. The dist path of the project where the files should be copied to |
| `dockerFilePath`   | `string` |                             | Required. The path to the dockerfile for the project.                      |
| `dockerIgnorePath` | `string` | `${distPath}/.dockerignore` | The path to the .dockerignore for the project.                             |

#### Example:

The following workspace configuration illustrates a possible docker `copyFiles` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "copyDockerFiles": {
          "executor": "@nx-boat-tools/docker:copyFiles",
          "options": {
            "dockerFilePath": "apps/example/dockerfile",
            "dockerIgnorePath": "apps/example/.dockerignore",
            "distPath": "dist/apps/example"
          }
        }
      }
    }
  }
}
```

To run this we just need to execute the `copyDockerFiles` target...

```bash
nx copyDockerFiles example
# OR
nx run example:copyDockerFiles
```

This would result in copying the `dockerfile` and `.dockerignore` files to `dist/apps/example`

### `publish`

The `publish` executor will create tags for `latest` and the version in the project's `package.json` file, then upload the image to either the user or repo specifed by runing the corresponding `docker push` commands.

#### 🚩  Note:

If no `package.json` exists for the project or it does not specify a version then only `latest` will be tagged and pushed.

#### 🚩  Note:

The `docker` plugin does not handle authentication. You will need to do a `docker login` before running the `publish` executor.

#### Available options:

| name               | type     | default | description                                                |
| ------------------ | -------- | ------- | ---------------------------------------------------------- |
| `dockerRepoOrUser` | `string` |         | Required. This is the user or repo to publish the image to |
| `buildPath`        | `string` |         | The path to the project's `dockerfile`                     |

#### Example:

The following workspace configuration illustrates a possible docker `publish` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "publish": {
          "executor": "@nx-boat-tools/docker:publish",
          "options": {
            "buildPath": "apps/example",
            "dockerRepoOrUser": "registry-host:5000/myadmin"
          }
        }
      }
    }
  }
}
```

To upload the image to our repo we just need to execute the `publish` target...

```bash
nx publish example
# OR
nx run example:publish
```

Both of the above would upload the image to our `registry-host:5000/myadmin` repo as `example:latest` and `example:XX.YY`

### `run`

The `run` executor can be used to run docker image for a project.

#### 🚩  Note:

The docker image needs to have already been built locally before running the `run` executor.

#### Available options:

| name     | type     | default | description                                                                                                                                                                                                                                            |
| -------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vars`   | `object` | {}      | This is an object used to create environment variables to pass into the container. The key is the environment variable name and the value is the value to set the variable to. Both the key and value must be strings.                                 |
| `ports`  | `object` | {}      | This is an object used to create port mappings to pass into the container. The key is port to expose on the host machine and the value is port used by the container, both of which must be integers.                                                  |
| `mounts` | `object` | {}      | This is an object used to create volume mount mappings to pass into the container. The key is the directory on the host machine name and the value is the path inside the container to mount the directory to. Both the key and value must be strings. |

#### Example:

The following workspace configuration illustrates a possible docker `run` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "run": {
          "executor": "@nx-boat-tools/docker:run",
          "options": {
            "outputPath": "dist/apps/example",
            "ports": {
              "80": 5000
            },
            "mounts": {
              "/tmp/example/config": "/example/config"
            },
            "vars": {
              "ASPNETCORE_ENVIRONMENT": "develop"
            }
          },
          "configurations": {
            "prod": {
              "vars": {
                "ASPNETCORE_ENVIRONMENT": "production"
              }
            }
          }
        }
      }
    }
  }
}
```

To run this docker image we just need to execute the `run` target...

```bash
nx run example
# OR
nx run example:run
```

Both of the above would run the following docker CLI command

```bash
docker run --rm -e ASPNETCORE_ENVIRONMENT=develop -p 80:5000 -v /tmp/example/config:/example/config
```

Here's another example but this time using a configuration...

```bash
nx run example:run:production
```

Which would run the following docker CLI command

```bash
docker run --rm -e ASPNETCORE_ENVIRONMENT=production -p 80:5000 -v /tmp/example/config:/example/config
```

### `minikubeBuild`

The `minikubeBuild` executor connects to the docker daemon within minikube and then builds the docker image from a `dockerfile` for a given project. It tags the image as both `latest` and the version in the project's `package.json`.

#### 🚩  Note:

If no `package.json` exists for the project or it does not specify a version then only `latest` will be tagged.

#### 🚩  Note:

The `buildPath` is set to the dist directory of a project by default as that is where the files that will be copied into docker usually are located. This means that the `copyFiles` executor needs to have ran first as well as any other executors producing build output that needs to be copied into the docker image.

#### Available options:

| name             | type     | default                   | description                                    |
| ---------------- | -------- | ------------------------- | ---------------------------------------------- |
| `buildPath`      | `string` |                           | Required. The path to pass to the docker build |
| `dockerFilePath` | `string` | `${buildPath}/dockerfile` | The path to the dockerfile for the project.    |

#### Example:

The following workspace configuration illustrates a possible docker `minikubeBuild` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "buildMinikubeImage": {
          "executor": "@nx-boat-tools/docker:minikubeBuild",
          "options": {
            "dockerFilePath": "apps/example/dockerfile",
            "buildPath": "apps/example"
          }
        }
      }
    }
  }
}
```

To build our docker image within minikube we just need to execute the `minikubeBuild` target...

```bash
nx minikubeBuild example
# OR
nx run example:minikubeBuild
```

Both of the above would result in a docker image being built within the docker daemon within minikube that's named `example` and would be tagged with `latest` and the version in the `package.json`

## ✍️  Generators

### `docker`

The `docker` generator adds docker support to an existing Nx project. It creates a default `dockerfile` and `.dockerignore` and update the project in the `workspace.json` to include all the appropriate docker targets.

#### Available options:

| name               | type      | default | description                                                                                  |
| ------------------ | --------- | ------- | -------------------------------------------------------------------------------------------- |
| `project`          | `string`  |         | Required. The name of the project to add docker to.                                          |
| `dockerRepoOrUser` | `string`  |         | Required. This is used for the publish target and is the user or repo to upload the image to |
| `baseDockerImage` | `string` | | The base docker image to use in the generated dockerfile |
| `runPortMappings` | `string` | | When running the docker image, this is an comma delimited string used to create port mappings to pass into the container |
| `runVolumeMounts` | `string` | | When running the docker image, this is an comma delimited string used to create volume mount mappings to pass into the container |
| `runVariables` | `string` | | When running the docker image, this is an comma delimited string used to set environment variables within the container |
| `minikube`         | `boolean` |         | Whether or not to add post targets for minikube.                                       |

#### Generated files:

The `dockerfile` and `.dockerignore` files that are generated are just placeholders. It is up to you to define their contents based on the needs of your project.

#### Updates to `workspace.json`:

The project configuration will be updated as follows:

- `build` - If a `build` target existed previously then it will be renamed to to `buildSrc`. A new `build` will then be added and is a `chain-execute` with the following stages and targets:

  🚩  Note: If no `build` target exists before running the `docker` generator the no root stage will be added.

  - The `root` stage:
    - `buildSrc` - This is the previous build target and we want it to run first
  - The `dockerImage` stage:
    - `copyDockerFiles` - This calls the docker `copyFiles` target to copy the `dockerfile` to the dist directory to prepare for building the image
    - `buildDockerImage` - This calls the docker `build` target to build the docker image
  - The `minikubeImage` stage (only added if `--minikube=true`):
    - `buildMinikubeImage` - THis calls the docker `buildMinikube` target to build the docker image within minikube

- `package` - If a `package` target existed previously then it will be renamed to to `packageSrc`. A new `package` will then be added and is a `chain-execute` with the following stages and targets:

  🚩  Note: If no `package` target exists before running the `docker` generator the no root stage will be added.

  - The `root` stage
    - `buildSrc` - This is the previous package target and we want it to run first
  - The `dockerImage` stage
    - `publishDockerImage` - Added as an additional target, this calls the docker `publish` executor to upload the docker image to a repo

- `runDockerImage` - this calls the docker `run` target to run the docker image

The following is a full example of what's added to the `workspace.json` for a project when adding docker to it:

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
              "dockerImage": {
                "targets": ["copyDockerFiles", "buildDockerImage"]
              },
              "minikubeImage": {
                "explicit": true,
                "targets": ["copyDockerFiles", "buildMinikubeImage"]
              }
          }
        },
        "buildDockerImage": {
          "executor": "@nx-boat-tools/docker:build",
          "options": {
            "buildPath": "dist/apps/my-app"
          }
        },
        "buildSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "copyDockerFiles": {
          "executor": "@nx-boat-tools/docker:copyFiles",
          "options": {
            "distPath": "dist/apps/my-app"
          }
        },
        "package": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "stages": {
              "dockerImage": {
                "postTargets": ["publishDockerImage"]
              }
            }
          }
        },
        "publishDockerImage": {
          "executor": "@nx-boat-tools/docker:publish",
          "options": {
            "buildPath": "dist/apps/my-app",
            "dockerRepoOrUser": "my-dockerhub-user"
          }
        },
        "runDockerImage": {
          "executor": "@nx-boat-tools/docker:run",
          "options": {
            "ports": {
              "8080": 80
            },
            "mounts": {
              "dist/apps/my-app": "/usr/share/nginx/html"
            }
          }
        },
        "buildMinikubeImage": {
          "executor": "@nx-boat-tools/docker:minikubeBuild",
          "options": {
            "dockerFilePath": "apps/my-app/dockerfile",
            "buildPath": "apps/my-app"
          }
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `docker` to a project

The following illustrates how to add a docker support project with various options:

```bash
#Add docker to a project named my-project that publishes to dockerhub for user my-dockerhub-user
nx g @nx-dev-tools/docker:docker my-project --dockerRepoOrUser=my-dockerhub-user --minikube=false
```
