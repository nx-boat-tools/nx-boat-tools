import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { DotnetOptions, runDotnetCommand$ } from '../base/dotnet';

interface DotnetPackagerOptions extends JsonObject {
    srcPath: string;
    outputPath: string;
    runtimeID: string;
    configMap: JsonObject;
  }

export default createBuilder<DotnetPackagerOptions>(
    (options: DotnetPackagerOptions, context: BuilderContext): Promise<BuilderOutput> => {
        const dotnetOptions = {
            ...options,
            action: 'pack',
            additionalArgs: '--no-build',
            updateVersion: false
        } as DotnetOptions;

        return runDotnetCommand$(dotnetOptions, context).toPromise();
    }
);
