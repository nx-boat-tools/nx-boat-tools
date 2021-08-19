import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { DotnetOptions, runDotnetCommand$ } from '../base/dotnet';

interface DotnetCleanerOptions extends JsonObject {
    srcPath: string;
    outputPath: string;
    runtimeID: string;
    configMap: JsonObject;
  }

export default createBuilder<DotnetCleanerOptions>(
    (options: DotnetCleanerOptions, context: BuilderContext): Promise<BuilderOutput> => {
        const dotnetOptions = {
            ...options,
            action: 'clean',
            updateVersion: false
        } as DotnetOptions;

        return runDotnetCommand$(dotnetOptions, context).toPromise();
    }
);
