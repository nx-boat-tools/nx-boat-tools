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
| name                         | type       | default    | description                                      |
| ---------------------------- | ---------- | ---------- | ------------------------------------------------ |
| `targets` | `string[]` | `[]` | An array containing the other executors to call |
| `additionalTargets` | `string[]` | `[]` | An array containing additional builders to call (for configurations) |

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
          "executor": "@nrwl/linter:eslint",
          //...
        },
        "buildSrc": {
          "executor": "@nrwl/node:package",
          //...
        },
        "special": {
          "executor": "some-special-executor",
          //...
        },
        "build": {
          "executor": "@nx-boat-tools/common:chain-execute",
          "options": {
            "targets": [ "lint", "buildSrc" ]
          },
          "configurations": {
            "production": {
              "additionalTargets": [ "special" ]
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

### `set-version`

🤦  Sorry... the `set-version` executor documentation is still a work in progress

## ✍️  Generators

### `common`

🤦  Sorry... the `common` generator is still a work in progress