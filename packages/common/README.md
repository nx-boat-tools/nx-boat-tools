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

| name                | type       | default                 | description                                                          |
| ------------------- | ---------- | ----------------------- | -------------------------------------------------------------------- |
| `targets`           | `string[]` | `[]`                    | An array containing the other executors to call                      |
| `additionalTargets` | `string[]` | `[]`                    | An array containing additional builders to call (for configurations) |
| `stages`            | `object`   |                         | The stage definitions for the chain. See [Using Stages]() below.     |
| `run`               | `string[]` | all non-explicit stages | An array what stages to run. See [Using Stages]() below.             |

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
              "additionalTargets": ["special"]
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

nx run example:build:production # will call lint, then buildSrc, and lastly special
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
        "special_post": {
          "executor": "some-special-executor"
          //...
        },
        "package": {
          "executor": "some-package-executor"
          //...
        },
        "package_post": {
          "executor": "some-package-executor"
          //...
        },
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": ["buildSrc"],
            "additionalTargets": ["lint"],
            "stages": {
              "special": {
                "targets": ["special"],
                "additionalTargets": ["special_post"]
              },
              "package": {
                "explicit": true,
                "targets": ["package"],
                "additionalTargets": ["package_post"]
              }
            }
          }
        }
      }
    }
  }
}
```

When the chain is executed, it starts by executing any regular targets, in order. It then will execute the targets for each stage in the order the stage is defined, skipping any stages that aren't in the run argument or fail the explicit requirement. Once all targets have been executed, it will then do the same thing with the additionalTargets, executing the regular additionalTargets and then those from the relevant stages, all in the order defined.

Let's look at some examples of how to use the above config.

```bash
nx build example
# This will call the following targets, in order: buildSrc, special, lint, special_post
# Note that, since the run arg wasn't specified, the package stage wasn't explicitly requested so it was skipped.

nx build example --run=special
# This is the same as the above command, running in order: buildSrc, special, lint, special_post
# Note that, since the run arg didn't include the package stage, it wasn't explicitly requested so it was skipped.

nx build example --run=package
# This will call the following targets, in order: buildSrc, package, lint, package_post
# Note that, since the run arg included the package stage, it was executed. Because the special stage wasn't, it was skipped.

nx build example --run=special,package
# This will call the following targets, in order: buildSrc, special, package, lint, special_post, package_post
# Note that, since the run arg included both the special and package stages, they were both executed.

```

## ✍️  Generators
