import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { DotnetOptions, runDotnetCommand$ } from '../base/dotnet';

interface DotnetBuilderOptions extends JsonObject {
    srcPath: string;
    outputPath: string;
    runtimeID: string;
    configMap: JsonObject;
    selfContained: boolean;
  }

export default createBuilder<DotnetBuilderOptions>(
    (options: DotnetBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
        const additionalArgs = options.selfContained === true ? '--self-containted' : '';

        const dotnetOptions = {
            srcPath: options.csprojPath,
            outputPath: options.outputPath,
            runtimeID: options.runtimeID,
            configMap: options.configMap,
            additionalArgs,
            action: 'publish',
            updateVersion: true
        } as DotnetOptions;

        return runDotnetCommand$(dotnetOptions, context).toPromise();
    }
);
