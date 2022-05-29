import * as _ from 'underscore';
import * as path from 'path';
import {
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  names,
} from '@nrwl/devkit';
import { existsSync } from 'fs';
import { sync as globSync } from 'glob';

import { getProjectReferencesFromCsprojFile } from '../utilities/csprojFileHelper';

export function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
) {
  const builder = new ProjectGraphBuilder(graph);

  _.each(context.workspace.projects, (config, name) => {
    const projectNames = names(name);

    if (
      existsSync(path.join(config.sourceRoot, `${projectNames.className}.sln`))
    ) {
      // The project was created with ownSolution = true
      // In this case, there isn't a way for the Nx project to reference any others directly.

      if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
        console.log(
          `The project '${name}' was detected dotnet project but has its own solution file. It cannot reference other Nx projects directly.`
        );
      }

      return;
    }

    const files = globSync(path.join(config.sourceRoot, '**', '*.csproj'), {
      nodir: true,
    });

    builder.graph.nodes[name].data.files = _.map(files, file => {
        return {
            file: file
        }
    })

    const allRefs = _.flatten(
      _.map(files, (file) => {
        const outsideRefs = _.filter(
          getProjectReferencesFromCsprojFile(file),
          (ref) => !ref.startsWith(config.root)
        );

        return {
          file: file,
          pathRefs: outsideRefs,
        };
      })
    );
    const dependencies = getProjectsReferenced(context, allRefs);

    _.each(dependencies, (dep) => {
      builder.addExplicitDependency(name, dep.file, dep.dependency);
    });
  });

  return builder.getUpdatedProjectGraph();
}

function getProjectsReferenced(
  context: ProjectGraphProcessorContext,
  references: Array<{ file: string; pathRefs: Array<string> }>
): Array<{ file: string; dependency: string }> {
  const projectRootsLookup: Array<{ project: string; root: string }> = _.map(
    context.workspace.projects,
    (project, name) => {
      return { project: name, root: project.root };
    }
  );

  const results: Array<{ file: string; dependency: string }> = [];

  _.each(references, (ref) => {
    _.each(ref.pathRefs, (pathRef) => {
      pathRef = pathRef.replace(/\.\.\\/g, '');
      pathRef = pathRef.replace(/\\/g, path.sep);
      const foundRoot = _.find(projectRootsLookup, (lookup) =>
        pathRef.startsWith(lookup.root)
      );

      results.push({ file: ref.file, dependency: foundRoot.project });
    });
  });

  return results;
}
