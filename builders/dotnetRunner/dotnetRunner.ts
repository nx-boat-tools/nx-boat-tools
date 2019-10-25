import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { DotnetOptions, runDotnetCommand$ } from '../base/dotnet';

interface DotnetRunnerOptions extends JsonObject {
    csprojPath: string;
    outputPath: string;
    runtimeID: string;
    selfContained: boolean;
    configMap: JsonObject;
    launchProfile: string;
  }

export default createBuilder<DotnetRunnerOptions>(
    (options: DotnetRunnerOptions, context: BuilderContext): Promise<BuilderOutput> => {
        const additionalArgs = options.launchProfile === undefined ? '' : `--launch-profile ${options.launchProfile}`;

        const dotnetOptions = {
            srcPath: options.csprojPath,
            outputPath: options.outputPath,
            runtimeID: options.runtimeID,
            selfContained: options.selfContained,
            configMap: options.configMap,
            action: 'run',
            additionalArgs,
            updateVersion: false
        } as DotnetOptions;

        return runDotnetCommand$(dotnetOptions, context).toPromise();
    }
);
