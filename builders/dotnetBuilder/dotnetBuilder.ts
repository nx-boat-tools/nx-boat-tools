import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { DotnetOptions, runDotnetCommand$ } from '../base/dotnet';

interface DotnetBuilderOptions extends JsonObject {
    srcPath: string;
    outputPath: string;
    runtimeID: string;
    selfContained: boolean;
    configMap: JsonObject;
  }

export default createBuilder<DotnetBuilderOptions>(
    (options: DotnetBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
        const dotnetOptions = {
            ...options,
            action: 'publish',
            updateVersion: true
        } as DotnetOptions;

        return runDotnetCommand$(dotnetOptions, context).toPromise();
    }
);
