import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import {
    addDependencies, addProject, createFiles, DotnetOptions, normalizeOptions, updateCsprojFile,
    updateNxJson
} from '../base/dotnet';
import { Schema } from './schema';

export default function dotnetConsole(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dotnetOptions = {
      ...schema,
      projectType: 'console'
     } as DotnetOptions;

    const options = normalizeOptions(dotnetOptions, host);

    return chain([
      createFiles(options),
      updateCsprojFile(options),
      addProject(options),
      updateNxJson(options),
      addDependencies(options)
    ])(host, context);
  };
}
