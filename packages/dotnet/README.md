# Nx Boat Tools - .Net

The "net" in the Nx Boat Tools toolbox. The `dotnet` plugin adds .Net project support to Nx but aims to do so in a very dotnet CLI familiar way. Currently, Nx Boat Tools can be used to build, package, publish, and clean .Net web APIs, console applications, and class libraries. It can also be used to run .Net web APIs and console applications for testing.

<hr>

- [Why not use the community `nx-dotnet` plugin](#why-not-use-the-community-nx-dotnet-plugin)
- [How to install](#how-to-install)
- [Supported .Net Versions](#supported-net-versions)
- [Executors](#executors)
  - [`run-dotnet-command`](#run-dotnet-command)
  - [`build`](#build)
  - [`clean`](#clean)
  - [`package`](#package)
  - [`publish`](#publish)
  - [`run`](#run)
  - [`test`](#test)
  - [`version`](#version)
- [Generators](#generators)
  - [`project`](#project)
  - [`classlib`](#classlib)
  - [`console`](#console)
  - [`grpc`](#grpc)
  - [`webapi`](#webapi)
  - [`test`](#test)
  - [`test-project`](#test-project)
  - [`project-ref`](#project-ref)

<hr>

## Why not use [the community `nx-dotnet` plugin](https://github.com/nx-dotnet/nx-dotnet)?

The `nx-dotnet` plugin is a more mature plugin and definetly has its benefits. It supports test projects and specifying the language to use while Nx Boat Tools currently does not. It also supports any template type supported by the dotnet CLI but it does this by running `dotnet new` each time a project is created. Nx Boat Tools instead runs `dotnet new` as a base and can tweak and add onto the created files if needed. This files then get baked into a release to be used with the generators. We feel this is a better practice and also opens the door to some additional features we hope to add down the road.

## 💡  How to install

```bash
npm install -D @nx-boat-tools/dotnet

# OR

yarn add -D @nx-boat-tools/dotnet
```

## 🔖  Supported .Net Versions

The `dotnet` plugin currently generates projects using [.Net 5.0](https://dotnet.microsoft.com/download/dotnet/5.0). The dotnet executors use the .Net CLI and should work with any project using .NET Core 2.x or later.

## 🏃  Executors

### `run-dotnet-command`

The `run-dotnet-command` is the heart of most of the dotnet executors and is meant to reflect the underlying dotnet CLI. Its job is to take in the various parameters, form the CLI command to run, and then execute it.

#### Available options:

| name             | type      | default     | description                                                                                                                                                                    |
| ---------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`         | `string`  |             | Required. The underlying dotnet command to run. Supported values include: `build`, `pack`, `publish`, `run`, `clean`                                                           |
| `srcPath`        | `string`  |             | Required. The path to the `csproj` or `sln` file for the project                                                                                                               |
| `outputPath`     | `string`  |             | Required. This maps to the `output` param of the CLI command and is the path to where build output should be created                                                           |
| `runtimeID`      | `string?` | `undefined` | This maps to the `runtime` param of the CLI command. For a list of Runtime Identifiers (RIDs), see the [RID catalog](https://docs.microsoft.com/en-us/dotnet/core/rid-catalog) |
| `additionalArgs` | `string?` | `undefined` | This is a string that is added to the end of the dotnet command and can be used for any available parameters that aren't explicitly defined in the executor options            |
| `configuration`  | `string?` | `undefined` | This is the `configuration` param of the CLI command. Ex: `Debug`                                                                                                              |

#### Example:

Although the `run-dotnet-command` executor can be called directly, it's mostly intended to just be called from the other dotnet executors. Below is an example of this being done by the `clean` executor.

```typescript
//executor.ts

export default async function runExecutor(
  options: CleanDotnetExecutorSchema,
  context: ExecutorContext
) {
  const dotnetOptions: DotNetCommandExecutorSchema = {
    ...options,
    action: 'clean',
  };

  await runDotnetCommand(dotnetOptions, context);

  return {
    success: true,
  };
}
```

### `build`

The `build` executor reflects calling the `dotnet build` command with the dotnet CLI. It builds a dotnet project or solution and all its dependencies. See [here](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-build) for additional information on the underlying CLI command.

#### Available options:

| name             | type      | default     | description                                                                                                                |
| ---------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string`  |             | Required. This is passed to the `srcPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)    |
| `outputPath`     | `string`  |             | Required. This is passed to the `outputPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command) |
| `runtimeID`      | `string?` | `undefined` | This is passed to the `runtimeID` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)            |
| `additionalArgs` | `string?` | `undefined` | This is passed to the `additionalArgs` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)       |
| `configuration`  | `string?` | `undefined` | This is passed to the `configuration` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)        |

#### Example:

The following workspace configuration illustrates a possible dotnet `build` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "build": {
          "executor": "@nx-boat-tools/dotnet:build",
          "options": {
            "srcPath": "apps/example/example.sln",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release",
              "additionalArgs": "--nologo"
            }
          }
        }
      }
    }
  }
}
```

To build our dotnet project we just need to execute the `build` target...

```bash
nx build example
# OR
nx run example:build
```

Both of the above would run the following dotnet CLI command

```bash
dotnet build projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example
```

Here's another example but this time using a configuration...

```bash
nx run example:build:prod
```

Which would run the following dotnet CLI command

```bash
dotnet build projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example --configuration Release --nologo
```

### `clean`

The `clean` executor reflects calling the `dotnet clean` command with the dotnet CLI. It cleans the output of a project or solution. See [here](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-clean) for additional information on the underlying CLI command.

#### Available options:

| name             | type      | default     | description                                                                                                                |
| ---------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string`  |             | Required. This is passed to the `srcPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)    |
| `outputPath`     | `string`  |             | Required. This is passed to the `outputPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command) |
| `runtimeID`      | `string?` | `undefined` | This is passed to the `runtimeID` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)            |
| `additionalArgs` | `string?` | `undefined` | This is passed to the `additionalArgs` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)       |
| `configuration`  | `string?` | `undefined` | This is passed to the `configuration` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)        |

#### Example:

The following workspace configuration illustrates a possible dotnet `clean` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "clean": {
          "executor": "@nx-boat-tools/dotnet:clean",
          "options": {
            "srcPath": "apps/example/example.sln",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release",
              "additionalArgs": "--nologo"
            }
          }
        }
      }
    }
  }
}
```

To perform a clean on our dotnet project we just need to execute the `clean` target...

```bash
nx clean example
# OR
nx run example:clean
```

Both of the above would run the following dotnet CLI command

```bash
dotnet clean projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example
```

Here's another example but this time using a configuration...

```bash
nx run example:clean:prod
```

Which would run the following dotnet CLI command

```bash
dotnet clean projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example --configuration Release --nologo
```

### `package`

The `package` executor reflects calling the `dotnet pack` command with the dotnet CLI. It packages the project or solution into a NuGet package. See [here](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-pack) for additional information on the underlying CLI command.

#### 🚩  Note:

The `csproj` file(s) will be updated to set the `IsPackable` property to `true`. This will allow all project types to be packaged and not just `classlib` projects.

#### Available options:

| name             | type      | default     | description                                                                                                                |
| ---------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string`  |             | Required. This is passed to the `srcPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)    |
| `outputPath`     | `string`  |             | Required. This is passed to the `outputPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command) |
| `runtimeID`      | `string?` | `undefined` | This is passed to the `runtimeID` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)            |
| `additionalArgs` | `string?` | `undefined` | This is passed to the `additionalArgs` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)       |
| `configuration`  | `string?` | `undefined` | This is passed to the `configuration` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)        |

#### Example:

The following workspace configuration illustrates a possible dotnet `package` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "package": {
          "executor": "@nx-boat-tools/dotnet:package",
          "options": {
            "srcPath": "apps/example/example.sln",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release",
              "additionalArgs": "--nologo"
            }
          }
        }
      }
    }
  }
}
```

To package our dotnet project into a NuGet package we just need to execute the `package` target...

```bash
nx package example
# OR
nx run example:package
```

Both of the above would run the following dotnet CLI command

```bash
dotnet package projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example
```

Here's another example but this time using a configuration...

```bash
nx run example:package:prod
```

Which would run the following dotnet CLI command

```bash
dotnet package projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example --configuration Release --nologo
```

### `publish`

The `publish` executor reflects calling the `dotnet publish` command with the dotnet CLI. It publishes the project and its dependencies to a folder for deployment. See [here](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-publish) for additional information on the underlying CLI command.

#### Available options:

| name             | type      | default     | description                                                                                                                |
| ---------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string`  |             | Required. This is passed to the `srcPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)    |
| `outputPath`     | `string`  |             | Required. This is passed to the `outputPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command) |
| `runtimeID`      | `string?` | `undefined` | This is passed to the `runtimeID` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)            |
| `additionalArgs` | `string?` | `undefined` | This is passed to the `additionalArgs` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)       |
| `configuration`  | `string?` | `undefined` | This is passed to the `configuration` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)        |

#### Example:

The following workspace configuration illustrates a possible dotnet `publish` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "publish": {
          "executor": "@nx-boat-tools/dotnet:publish",
          "options": {
            "srcPath": "apps/example/example.sln",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release",
              "additionalArgs": "--nologo"
            }
          }
        }
      }
    }
  }
}
```

To get the dotnet project ready for deployment we just need to execute the `publish` target...

```bash
nx publish example
# OR
nx run example:publish
```

Both of the above would run the following dotnet CLI command

```bash
dotnet publish projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example
```

Here's another example but this time using a configuration...

```bash
nx run example:publish:prod
```

Which would run the following dotnet CLI command

```bash
dotnet publish projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example --configuration Release --nologo
```

### `run`

The `run` executor reflects calling the `dotnet run` command with the dotnet CLI. It runs a project without doing any compliling, etc. See [here](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-run) for additional information on the underlying CLI command.

#### Available options:

| name             | type      | default     | description                                                                                                                |
| ---------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string`  |             | Required. This is passed to the `srcPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)    |
| `outputPath`     | `string`  |             | Required. This is passed to the `outputPath` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command) |
| `runtimeID`      | `string?` | `undefined` | This is passed to the `runtimeID` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)            |
| `additionalArgs` | `string?` | `undefined` | This is passed to the `additionalArgs` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)       |
| `configuration`  | `string?` | `undefined` | This is passed to the `configuration` option of the underlying [`run-dotnet-command` executor](#run-dotnet-command)        |

#### Example:

The following workspace configuration illustrates a possible dotnet `run` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "runSrc": {
          "executor": "@nx-boat-tools/dotnet:run",
          "options": {
            "srcPath": "apps/example/example.sln",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release",
              "additionalArgs": "--nologo"
            }
          }
        }
      }
    }
  }
}
```

To run our dotnet project we just need to execute the `runSrc` target...

```bash
nx runSrc example
# OR
nx run example:runSrc
```

Both of the above would run the following dotnet CLI command

```bash
dotnet run projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example
```

Here's another example but this time using a configuration...

```bash
nx run example:runSrc:prod
```

Which would run the following dotnet CLI command

```bash
dotnet run projectRoot/apps/example/example.sln --output projectRoot/dist/apps/example --configuration Release --nologo
```

### `test`

The `test` executor is a utility function that updates the versions in all `csproj` files associaciated with the project to match the version specified in the project's `package.json`

#### Available options:

| name             | type     | default                | description                                                                                                                                                         |
| ---------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `srcPath`        | `string` |                        | Required. This is the `csproj` or `sln` file associated with the project                                                                                            |
| `outputPath`     | `string` |                        | Required. This maps to the `output` param of the CLI command and is the path to where build output should be created                                                |
| `coveragePath`   | `string` | coverage/{projectRoot} | This maps to the `results-directory` param of the CLI command but the folder structure of the results will be flattened                                             |
| `collector`      | `string` | XPlat Code Coverage    | This is the `collector` param of the CLI command                                                                                                                    |
| `configuration`  | `string` |                        | This is the `configuration` param of the CLI command                                                                                                                |
| `runtimeID`      | `string` |                        | This maps to the `runtime` param of the CLI command                                                                                                                 |
| `additionalArgs` | `string` |                        | This is a string that is added to the end of the dotnet command and can be used for any available parameters that aren't explicitly defined in the executor options |

#### Example:

The following workspace configuration illustrates a possible dotnet `test` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "testSrc": {
          "executor": "@nx-boat-tools/dotnet:test",
          "options": {
            "srcPath": "apps/example/tests/Example.Tests/Example.Tests.csproj",
            "outputPath": "dist/apps/example",
            "configuration": "Debug"
          },
          "configurations": {
            "prod": {
              "configuration": "Release"
            }
          }
        }
      }
    }
  }
}
```

To test our dotnet project we just need to execute the `testSrc` target...

```bash
nx test example
# OR
nx run example:test
```

Both of the above would run the following dotnet CLI command

```bash
dotnet test projectRoot/apps/example/tests/Example.Tests/Example.Tests.csproj --output projectRoot/dist/apps/example --results-directory projectRoot/coverage/apps/example --collector "XPlat Code Coverage" --configuration Debug
```

Here's another example but this time using the prod configuration...

```bash
nx run example:test:prod
```

Which would run the following dotnet CLI command

```bash
dotnet test projectRoot/apps/example/tests/Example.Tests/Example.Tests.csproj --output projectRoot/dist/apps/example --results-directory projectRoot/coverage/apps/example --collector "XPlat Code Coverage" --configuration Release
```

### `version`

The `version` executor is a utility function that updates the versions in all `csproj` files associaciated with the project to match the version specified in the project's `package.json`

#### Available options:

| name      | type     | default | description                                                              |
| --------- | -------- | ------- | ------------------------------------------------------------------------ |
| `srcPath` | `string` |         | Required. This is the `csproj` or `sln` file associated with the project |

#### Example:

The following workspace configuration illustrates a possible dotnet `run` target for a given project.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "dotnetVersion": {
          "executor": "@nx-boat-tools/dotnet:version",
          "options": {
            "srcPath": "apps/example/example.sln"
          }
        }
      }
    }
  }
}
```

## ✍️  Generators

### `project`

The `project` generator is the heart of all of the dotnet generators. Its job is to take in the various parameters, create the project files based on the corresponding template, and add the project to the `workspace.json` will all the appropriate dotnet targets for the dotnet project type.

#### Available options:

| name               | type      | default               | description                                                                                                                                                                                                                                                                                              |
| ------------------ | --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. The name of the dotnet project that's being created.                                                                                                                                                                                                                                           |
| `tags`             | `string?` | `undefined`           | Tags to be used when adding the project to the `workspace.json`. More information about tags can be found [here](https://nx.dev/l/a/structure/monorepo-tags)                                                                                                                                             |
| `directory`        | `string?` | `undefined`           | This can be used to nest the project into additional folders inside of the `apps` or `libs` folder. Insead of going to `apps/{projectName}`, for example, the project can be created at `apps/{directoryValue}/{projectName}`                                                                            |
| `projectType`      | `string`  |                       | This identifies what type of project to create. The values should be the same values as what's passed to the [`TEMPLATE` argument](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-new#arguments) of the `dotnet new` command. Currently supported values are: `classlib`, `console`, `webapi` |
| `ownSolution`      | `boolean` | `false`               | When set to `true`, the project will have its own solution file which will be in the project directory. When set to `false`, it will be added to a solution file at the workspace root.                                                                                                                  |
| `standaloneConfig` | `boolean` | the workspace default | Should the project use package.json? If false, the project config is inside workspace.json                                                                                                                                                                                                               |
| `frameworkVersion` | `string`  | `LTS`                 | The .Net Framework version to use. Valid options are either `latest` (7.0) or `LTS` (6.0).                                                                                                                                                                                                               |
| `testProjectType`  | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`, `xunit`, or `none`.                                                                                                                                                                                                                         |

#### Generated files:

What files are generated depend on the `projectType` that's specified but should mostly reflect the same files you'd get from running `dotnet new {projectType}`. Other than the addition of a `package.json` file for the project, the biggest difference is whether or not the solution file is created or if another one is appended to.

#### Updates to project configuration:

The project is added to the project configuration with the following high-level targets defined:

- `build` - This runs the dotnet `build` executor for the project
- `dotnetVersion` - This runs the `version` executor to ensure the `csproj` versions match the project's `package.json`
- `package` - This runs the dotnet `package` executor
- `clean` - this calls the dotnet `clean` executor to clean up build output
- `run` - this calls the dotnet `run` target to run the application
- `version` - This updates the project version utilizing the [@jscutlery/semver](https://github.com/jscutlery/semver) community plugin. The `dotnetVersion` is added to the `postTargets` parameter so the `csproj` files are updated at the same time.

🚩  Note: The `run` target is not added when `classlib` is specified for `projectType`

The following is a full example of what's added to the project configuration for a dotnet project, in this case for a `projectType` of `console`:

```jsonc
//workspace.json

{
  //...
  "projects": {
    "console-app": {
      "root": "apps/console-app",
      "projectType": "application",
      "sourceRoot": "apps/console-app/src",
      "targets": {
        "build": {
          "executor": "@nx-boat-tools/dotnet:build",
          "options": {
            "srcPath": "./workspace-name.sln",
            "outputPath": "dist/apps/console-app",
            "configuration": "Debug"
          },
          "configurations": {
            "dev": {},
            "prod": {}
          }
        },
        "clean": {
          "executor": "@nx-boat-tools/dotnet:clean",
          "options": {
            "srcPath": "./workspace-name.sln",
            "outputPath": "dist/apps/console-app",
            "configuration": "Debug"
          },
          "configurations": {
            "dev": {},
            "prod": {}
          }
        },
        "dotnetVersion": {
          "executor": "@nx-boat-tools/dotnet:version",
          "options": {
            "srcPath": "./workspace-name.sln"
          },
          "configurations": {
            "dev": {},
            "prod": {}
          }
        },
        "package": {
          "executor": "@nx-boat-tools/dotnet:package",
          "options": {
            "srcPath": "./workspace-name.sln",
            "outputPath": "dist/apps/console-app",
            "configuration": "Debug"
          },
          "configurations": {
            "dev": {},
            "prod": {}
          }
        },
        "run": {
          "executor": "@nx-boat-tools/dotnet:run",
          "options": {
            "srcPath": "./workspace-name.sln",
            "outputPath": "dist/apps/console-app",
            "configuration": "Debug"
          },
          "configurations": {
            "dev": {},
            "prod": {}
          }
        },
        "version": {
          "executor": "@@jscutlery/semver:version",
          "options": {
            "commitMessageFormat": "chore(${projectName}): release version ${version}",
            "postTargets": ["dotnetVersion"]
          }
        }
      },
      "tags": ""
    }
  }
}
```

### `classlib`

Creates a dotnet class library project.

#### Available options:

| name               | type      | default               | description                                                                                       |
| ------------------ | --------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. This is passed to the `name` option of the underlying [`project` generator](#project)   |
| `tags`             | `string?` | `undefined`           | This is passed to the `tags` option of the underlying [`project` generator](#project)             |
| `directory`        | `string?` | `undefined`           | This is passed to the `directory` option of the underlying [`project` generator](#project)        |
| `ownSolution`      | `boolean` | `false`               | This is passed to the `ownSolution` option of the underlying [`project` generator](#project)      |
| `standaloneConfig` | `boolean` | the workspace default | This is passed to the `standaloneConfig` option of the underlying [`project` generator](#project) |
| `frameworkVersion` | `string`  | `LTS`                 | This is passed to the `frameworkVersion` option of the underlying [`project` generator](#project) |
| `testProjectType`  | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`, `xunit`, or `none`.                  |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `dotnet new classlib`. The biggest difference is whether or not the solution file is created or if another one is appended to. The project directory for `classlib` projects will be under the `libs` folder in the workspace.

#### Creating a `classlib` project

The following illustrates how to add a dotnet `classlib` project with various options:

```bash
#Create a project named my-classlib in libs/my-classlib and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:classlib my-classlib

#Create a project named my-classlib in libs/my-classlib with the solution at libs/my-classlib/MyClasslib.sln
nx g @nx-dev-tools/dotnet:classlib my-classlib --ownSolution=true

#Create a project named my-classlib in libs/internal/my-classlib and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:classlib my-classlib --directory=internal
```

### `console`

Creates a dotnet console application project.

#### Available options:

| name               | type      | default               | description                                                                                       |
| ------------------ | --------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. This is passed to the `name` option of the underlying [`project` generator](#project)   |
| `tags`             | `string?` | `undefined`           | This is passed to the `tags` option of the underlying [`project` generator](#project)             |
| `directory`        | `string?` | `undefined`           | This is passed to the `directory` option of the underlying [`project` generator](#project)        |
| `ownSolution`      | `boolean` | `false`               | This is passed to the `ownSolution` option of the underlying [`project` generator](#project)      |
| `standaloneConfig` | `boolean` | the workspace default | This is passed to the `standaloneConfig` option of the underlying [`project` generator](#project) |
| `frameworkVersion` | `string`  | `LTS`                 | This is passed to the `frameworkVersion` option of the underlying [`project` generator](#project) |
| `testProjectType`  | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`, `xunit`, or `none`.                  |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `dotnet new console`. The biggest difference is whether or not the solution file is created or if another one is appended to. The project directory for `console` projects will be under the `apps` folder in the workspace.

#### Creating a `console` project

The following illustrates how to add a dotnet `console` project with various options:

```bash
#Create a project named my-console-app in apps/my-console-app and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:console my-console-app

#Create a project named my-console-app in apps/my-console-app with the solution at apps/my-console-app/MyConsoleApp.sln
nx g @nx-dev-tools/dotnet:console my-console-app --ownSolution=true

#Create a project named my-console-app in apps/internal/my-console-app and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:console my-console-app --directory=internal
```

### `grpc`

Creates a dotnet grpc application project.

#### Available options:

| name               | type      | default               | description                                                                                       |
| ------------------ | --------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. This is passed to the `name` option of the underlying [`project` generator](#project)   |
| `tags`             | `string?` | `undefined`           | This is passed to the `tags` option of the underlying [`project` generator](#project)             |
| `directory`        | `string?` | `undefined`           | This is passed to the `directory` option of the underlying [`project` generator](#project)        |
| `ownSolution`      | `boolean` | `false`               | This is passed to the `ownSolution` option of the underlying [`project` generator](#project)      |
| `standaloneConfig` | `boolean` | the workspace default | This is passed to the `standaloneConfig` option of the underlying [`project` generator](#project) |
| `frameworkVersion` | `string`  | `LTS`                 | This is passed to the `frameworkVersion` option of the underlying [`project` generator](#project) |
| `testProjectType`  | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`, `xunit`, or `none`.                  |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `dotnet new grpc`. The biggest difference is whether or not the solution file is created or if another one is appended to. The project directory for `grpc` projects will be under the `apps` folder in the workspace.

#### Creating a `grpc` project

The following illustrates how to add a dotnet `grpc` project with various options:

```bash
#Create a project named my-grpc-app in apps/my-grpc-app and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:grpc my-grpc-app

#Create a project named my-grpc-app in apps/my-grpc-app with the solution at apps/my-grpc-app/MyGrpcApp.sln
nx g @nx-dev-tools/dotnet:grpc my-grpc-app --ownSolution=true

#Create a project named my-grpc-app in apps/internal/my-grpc-app and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:grpc my-grpc-app --directory=internal
```

### `webapi`

Creates a dotnet web API project.

#### Available options:

| name               | type      | default               | description                                                                                       |
| ------------------ | --------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. This is passed to the `name` option of the underlying [`project` generator](#project)   |
| `tags`             | `string?` | `undefined`           | This is passed to the `tags` option of the underlying [`project` generator](#project)             |
| `directory`        | `string?` | `undefined`           | This is passed to the `directory` option of the underlying [`project` generator](#project)        |
| `ownSolution`      | `boolean` | `false`               | This is passed to the `ownSolution` option of the underlying [`project` generator](#project)      |
| `standaloneConfig` | `boolean` | the workspace default | This is passed to the `standaloneConfig` option of the underlying [`project` generator](#project) |
| `frameworkVersion` | `string`  | `LTS`                 | This is passed to the `frameworkVersion` option of the underlying [`project` generator](#project) |
| `testProjectType`  | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`, `xunit`, or `none`.                  |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `dotnet new webapi`. The biggest difference is whether or not the solution file is created or if another one is appended to. The project directory for `webapi` projects will be under the `apps` folder in the workspace.

#### Creating a `webapi` project

The following illustrates how to add a dotnet `webapi` project with various options:

```bash
#Create a project named my-api in apps/my-api and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:webapi my-api

#Create a project named my-api in apps/my-api with the solution at apps/my-api/MyApi.sln
nx g @nx-dev-tools/dotnet:webapi my-api --ownSolution=true

#Create a project named my-api in apps/internal/my-api and adds it to the workspace.sln
nx g @nx-dev-tools/dotnet:webapi my-api --directory=internal
```

### `test`

Adds a dotnet test project to an existing Nx project. The type of test project can be mstest, nunit, or xunit and is specified by the `testType` option which corresponds to test template values used in the `dotnet new` command.

#### Available options:

| name               | type      | default  | description                                                                                |
| ------------------ | --------- | -------- | ------------------------------------------------------------------------------------------ |
| `project`          | `string`  |          | Required. The name of the Nx project to add tests to                                       |
| `frameworkVersion` | `string`  | `LTS`    | The .Net Framework version to use. Valid options are either `latest` (7.0) or `LTS` (6.0). |
| `testType`         | `string`  | `mstest` | The type of test project to create. Either `mstest`,`nunit`,or `xunit`.                    |
| `testPrefix`       | `string?` |          | An optional prefix to give the tests. Ex: `integration` for `IntegrationTests`             |

#### Generated files:

The generated files should mostly reflect the same files you'd get from running `dotnet new mstest`, `dotnet new nunit`, or `dotnet new xunit` respectively. The project will be created in a `tests` directory within the project's root, for example: `apps/my-project/tests`.

#### Updates to project configuration:

The project's entry in the project configuration will be updated as follows:

- `test` - This calls a `chain-execute` with the a target for the test being added. The target name depends on if the `testPrefix` option was specified. If it was, then the target name is `test` plus the prefix in camel-casing. For example, given a prefix of `integration`, the target name would be `testIntegration`. If the `testPrefix` option was not specified, the target name will be `testSrc`.

The following is a full example of what's added to the project configuration when adding dotnet tests:

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
        "test": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["testUnit", "testIntegration"]
          }
        },
        "testIntegration": {
          "executor": "@nx-boat-tools/dotnet:test",
          "options": {
            "srcPath": "apps/my-app/tests/MyApp.IntegrationTests/MyApp.IntegrationTests.csproj",
            "outputPath": "dist/apps/my-app"
          }
        },
        "testUnit": {
          "executor": "@nx-boat-tools/dotnet:test",
          "options": {
            "srcPath": "apps/my-app/tests/MyApp.UnitTests/MyApp.UnitTests.csproj",
            "outputPath": "dist/apps/my-app"
          }
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

#### Creating a `test` project

The following illustrates how to add a dotnet `test` project with various options:

```bash
#Add a dotnet mstest project to the Nx my-api project
nx g @nx-dev-tools/dotnet:test my-api

#Add a dotnet mstest project to the Nx my-api project with a test prefix
nx g @nx-dev-tools/dotnet:test my-api --testPrefix=acceptance

#Add a dotnet 7.0 xunit project to the Nx my-api project with a test prefix
nx g @nx-dev-tools/dotnet:test my-api --testType=xunit --testPrefix=acceptance --frameworkVersion=latest
```

### `test-project`

Creates an Nx project specifically for a dotnet test project. The type of test project can be mstest, nunit, or xunit and is specified by the `testType` option which corresponds to test template values used in the `dotnet new` command.

#### Available options:

| name               | type      | default               | description                                                                                                                                                                                                                   |
| ------------------ | --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `string`  |                       | Required. The name of the project that's being created.                                                                                                                                                                       |
| `tags`             | `string?` | `undefined`           | Tags to be used when adding the project to the `workspace.json`. More information about tags can be found [here](https://nx.dev/l/a/structure/monorepo-tags)                                                                  |
| `directory`        | `string?` | `undefined`           | This can be used to nest the project into additional folders inside of the `apps` or `libs` folder. Insead of going to `apps/{projectName}`, for example, the project can be created at `apps/{directoryValue}/{projectName}` |
| `standaloneConfig` | `boolean` | the workspace default | Should the project use package.json? If false, the project config is inside workspace.json                                                                                                                                    |
| `frameworkVersion` | `string`  | `LTS`                 | The .Net Framework version to use. Valid options are either `latest` (7.0) or `LTS` (6.0).                                                                                                                                    |
| `testType`         | `string`  | `mstest`              | The type of test project to create. Either `mstest`,`nunit`,or `xunit`. create                                                                                                                                                |
| `testPrefix`       | `string?` |                       | An optional prefix to give the tests. Ex: `integration` for `IntegrationTests`                                                                                                                                                |

#### Generated files:

Other than the addition of a `package.json` file for the project, the generated files should mostly reflect the same files you'd get from running `dotnet new mstest`, `dotnet new nunit`, or `dotnet new xunit` respectively. The dotnet project will be created in a `tests` directory within the project's root, for example: `apps/my-project/tests`.

#### Updates to project configuration:

The project is added to the project configuration with the following high-level targets defined:

- `test` - This calls a `chain-execute` with the a target for the test being added. The target name depends on if the `testPrefix` option was specified. If it was, then the target name is `test` plus the prefix in camel-casing. For example, given a prefix of `integration`, the target name would be `testIntegration`. If the `testPrefix` option was not specified, the target name will be `testSrc`.

- `version` - This updates the project version utilizing the [@jscutlery/semver](https://github.com/jscutlery/semver) community plugin.

The following is a full example of what's added to the project configuration when adding a dotnet test project:

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
        "test": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["testUnit", "testIntegration"]
          }
        },
        "testIntegration": {
          "executor": "@nx-boat-tools/dotnet:test",
          "options": {
            "srcPath": "apps/my-app/tests/MyApp.IntegrationTests/MyApp.IntegrationTests.csproj",
            "outputPath": "dist/apps/my-app"
          }
        },
        "testUnit": {
          "executor": "@nx-boat-tools/dotnet:test",
          "options": {
            "srcPath": "apps/my-app/tests/MyApp.UnitTests/MyApp.UnitTests.csproj",
            "outputPath": "dist/apps/my-app"
          }
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

#### Creating a `test-project` project

The following illustrates how to add a dotnet `test-project` project with various options:

```bash
#Create a dotnet mstest project
nx g @nx-dev-tools/dotnet:test-project my-api

#Create a dotnet mstest project with a test prefix
nx g @nx-dev-tools/dotnet:test-project my-api --testPrefix=acceptance

#Create a dotnet 7.0 xunit project with a test prefix
nx g @nx-dev-tools/dotnet:test-project my-api --testType=xunit --testPrefix=acceptance --frameworkVersion=latest
```

### `project-ref`

The `project-ref` generator adds a dotnet project reference from one existing Nx dotnet project to another.

#### Available options:

| name        | type     | default | description                                                        |
| ----------- | -------- | ------- | ------------------------------------------------------------------ |
| `project`   | `string` |         | Required. The name of the project to add the reference to created. |
| `reference` | `string` |         | Required. The name of the project to be referenced.                |

#### Generated files:

The csproj file of the target project (the one where the reference will be added) will be updated to contain a `ProjectReference` to the csproj file of the refence project. If a `package.json` exits for both Nx projects, a dependency will be added to the target project's package.json and will point to the version specified in the reference project's package.json.

🚩  Note: Projects with their own solution file are not currently supported. Both the target and reference projects must utilize the root solution file.

#### Updates to project configuration:

The `project-ref` generator does not affect project configuration.

#### Creating a `test-project` project

The following illustrates how to add a dotnet `test-project` project with various options:

```bash
#Adds a project reference from the project named my-project to the project named some-lib
nx g @nx-dev-tools/dotnet:project-ref --project=my-project --reference=some-lib
```
