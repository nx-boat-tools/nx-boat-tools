# Nx Boat Tools - Common

The `common` plugin contains executors, generators, and other utilities that can be shared across all of the rest of the boat tools.

## 💡  How to install

```bash
npm install -D @nx-boat-tools/common

# OR

yarn add -D @nx-boat-tools/common
```

## 🏃  Executors

### `chain-execute`

Chain execute is an essential building block for the rest of Nx Boat Tools. With more complex projects, the build process can involve many different steps... each of which being their own executor. We see value in grouping these all together into a single "chain" executor so all steps will always be called each time and always in a particular order. Instead of running `lint`, `buildSrc`, `version`, `buildDocker`, etc individually, you can instead just run `build` and it can run them the same way every time.

#### Available options:

| name          | type       | default                 | description                                                                 |
| ------------- | ---------- | ----------------------- | --------------------------------------------------------------------------- |
| `targets`     | `string[]` | `[]`                    | An array containing the other executors to call                             |
| `preTargets`  | `string[]` | `[]`                    | An array containing additional targets to call before the main target block |
| `postTargets` | `string[]` | `[]`                    | An array containing additional targets to call after the main target block  |
| `stages`      | `object`   |                         | The stage definitions for the chain. See [Using Stages]() below.            |
| `run`         | `string[]` | all non-explicit stages | An array what stages to run. See [Using Stages]() below.                    |

#### Example:

First let's take a look at the workspace configuration below. It illustrates a `build` target that will chain together first the `lint` executor and then the `buildSrc` executor. If the configuration is specified to be `production` then it will then end by also calling the `special` executor as well.

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "setup": {
          "executor": "some-setup-executor"
          //...
        },
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "buildSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "special": {
          "executor": "some-special-executor"
          //...
        },
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["lint", "buildSrc"]
          },
          "configurations": {
            "production": {
              "preTargets": ["setup"],
              "postTargets": ["special"]
            }
          }
        }
      }
    }
  }
}
```

To trigger all of our build steps we now just have to call the `build` target...

```bash
nx build example # will call lint and then buildSrc

# OR

nx run example:build # will also call lint and then buildSrc

# OR, for production...

nx run example:build:production # will call setup first, then lint and buildSrc, and lastly special
```

#### Using Stages

Stages allow you to control what parts of a chain get ran apart from configurations. Think of it as, configurations specify _how_ something is built whereas stages specify _what_ is built. The idea is that the stages are defined in the json configuration and then a run argument can be specified when running the chain target. Let's take a look at a sample json config:

```jsonc
//workspace.json

{
  //...
  "projects": {
    "example": {
      //...
      "targets": {
        "clean": {
          "executor": "some-clean-executor"
          //...
        },
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "buildSrc": {
          "executor": "@nrwl/node:package"
          //...
        },
        "preSpecial": {
          "executor": "some-special-executor"
          //...
        },
        "special": {
          "executor": "some-special-executor"
          //...
        },
        "postSpecial": {
          "executor": "some-special-executor"
          //...
        },
        "prePackage": {
          "executor": "some-package-executor"
          //...
        },
        "package": {
          "executor": "some-package-executor"
          //...
        },
        "pastPackage": {
          "executor": "some-package-executor"
          //...
        },
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "preTargets": ["clean"],
            "targets": ["buildSrc"],
            "postTargets": ["lint"],
            "stages": {
              "special": {
                "targets": ["preSpecial"],
                "targets": ["special"],
                "postTargets": ["postSpecial"]
              },
              "package": {
                "explicit": true,
                "targets": ["prePackage"],
                "targets": ["package"],
                "postTargets": ["postPackage"]
              }
            }
          }
        }
      }
    }
  }
}
```

When the chain is executed, it will run any `preTargets` defined, then any regular `targets`, followed by any `postTargets`. For each "block", it starts by executing, in order, any "root" targets--that is any targets not inside a stage. It then will execute the targets for each stage in the order the stage is defined, skipping any stages that aren't in the run argument or fail the explicit requirement.

Let's look at some examples of how to use the above config.

```bash
nx build example
# This will call the following targets, in order: clean, preSpecial, buildSrc, special, lint, postSpecial
# Note that, since the run arg wasn't specified, the package stage wasn't explicitly requested so it was skipped.

nx build example --run=special
# This is the same as the above command, running in order: clean, preSpecial, buildSrc, special, lint, postSpecial
# Note that, since the run arg didn't include the package stage, it wasn't explicitly requested so it was skipped.

nx build example --run=package
# This will call the following targets, in order: clean, prePackage, buildSrc, package, lint, postPackage
# Note that, since the run arg included the package stage, it was executed. Because the special stage wasn't, it was skipped.

nx build example --run=special,package
# This will call the following targets, in order: clean, preSpecial, prePackage, buildSrc, special, package, lint, postSpecial, postPackage
# Note that, since the run arg included both the special and package stages, they were both executed.

```

## ✍️  Generators

### `chain`

The `chain` generator adds a chain-execute target to an existing Nx project.

#### Available options:

| name          | type     | default | description                                                           |
| ------------- | -------- | ------- | --------------------------------------------------------------------- |
| `name`        | `string` |         | Required. The name of the chain-execute target                        |
| `project`     | `string` |         | Required. The name of the project to add the chain-execute target to. |
| `preTargets`  | `string` |         | A comma seperated list of pre targets to include in the chain.        |
| `targets`     | `string` |         | A comma seperated list of pre targets to include in the chain.        |
| `postTargets` | `string` |         | A comma seperated list of post targets to include in the chain.       |

#### Updates to `workspace.json`:

The project configuration will be updated as follows:

- If a target with the same name that was specified existed previously and:
  - It was not a `chain-execute` target: it will be renamed to have a `Src` suffix.
  - It was a `chain-execute` target: the targets, preTargets, and postTargets specified will be appended to the end of any existing targets.
- If no target wth the name specified previously existed:
  - The target will then be added to the project as a `chain-execute` with the given targets, preTargets, and postTargets.

🚩  Note: The `chain` generator cannot add the actual targets used in the chain. It can only reference them and will not verify that they exist at the time the chain is created.

The following is an example of what's added to the `workspace.json` for a project when adding a chain-execute target:

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
        },
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "package": {
          "executor": "some-package-executor"
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
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "package": {
          "executor": "some-package-executor"
          //...
        },
        "someChain": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "preTargets": ["lint"],
            "targets": ["build"],
            "postTargets": ["package"]
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `chain` to a project

The following illustrates how to add a chain-execute target to a project:

```bash
#Add a chain-execute target named build to a project named my-project
nx g @nx-dev-tools/common:chain build --project=my-project --preTargets=pre1,pre2 --targets=target --postTargets=post1,post2
```

### `chain-stage`

The `chain-stage` generator adds a stage to a chain-execute target for an existing Nx project.

#### Available options:

| name          | type     | default | description                                                            |
| ------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `name`        | `string` |         | Required. The name of the chain-execute stage                          |
| `chainTarget` | `string` |         | Required. The name of the chain-execute target                         |
| `project`     | `string` |         | Required. The name of the project containing the chain-execute target. |
| `preTargets`  | `string` |         | A comma seperated list of pre targets to include in the stage.         |
| `targets`     | `string` |         | A comma seperated list of pre targets to include in the stage.         |
| `postTargets` | `string` |         | A comma seperated list of post targets to include in the stage.        |

#### Updates to `workspace.json`:

The project configuration will be updated as follows:

- If a target with the same name that was specified existed previously and:
  - It was not a `chain-execute` target: it will be renamed to have a `Src` suffix.
  - It was a `chain-execute` target:
    - The root targets, preTargets, and postTargets will be unaffected
    - If no stage with the name specified existed previously:
      - The stage will be appended after any existing stages and will contain the targets, preTargets, and postTargets specified
    - If a stage with the name specified existed previously:
      - The targets, preTargets, and postTargets specified will be appended to the end of any existing targets for the stage.
- If no target wth the name specified previously existed:
  - The target will then be added to the project as a `chain-execute` with the given stage containing the targets, preTargets, and postTargets specified.

🚩  Note: The `chain-stage` generator cannot add the actual targets used in the chain. It can only reference them and will not verify that they exist at the time the stage is created.

The following is an example of what's added to the `workspace.json` for a project when adding a stage to a chain-execute target:

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
        },
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "package": {
          "executor": "some-package-executor"
        },
        "pre": {
          "executor": "some-executor"
        },
        "post": {
          "executor": "some-executor"
        },
        "target": {
          "executor": "some-executor"
        },
        "someChain": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "preTargets": ["lint"],
            "targets": ["build"],
            "postTargets": ["package"]
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
        "lint": {
          "executor": "@nrwl/linter:eslint"
          //...
        },
        "package": {
          "executor": "some-package-executor"
          //...
        },
        "pre": {
          "executor": "some-executor"
        },
        "post": {
          "executor": "some-executor"
        },
        "someChain": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "preTargets": ["lint"],
            "targets": ["build"],
            "postTargets": ["package"],
            "stages": {
              "src": {
                "preTargets": ["pre"],
                "targets": ["target"],
                "postTargets": ["post"],
              }
            }
        },
        "target": {
          "executor": "some-executor"
        }
      },
      "tags": ""
    }
  }
}
```

#### Adding `chain-stage` to a project

The following illustrates how to add a stage to a chain-execute target for a project:

```bash
#Add a stage named src to the build chain-execute target for a project named my-project
nx g @nx-dev-tools/common:chain-stage src --chainTarget=build --project=my-project --preTargets=pre1,pre2 --targets=target --postTargets=post1,post2
```
