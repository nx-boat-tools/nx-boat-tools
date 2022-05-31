import * as _ from 'underscore';
import * as path from 'path';
import { Guid } from 'guid-typescript';
import { readFileSync } from 'fs';

export function getAllProjectsFromFile(
  dotnetProjectPath: string
): Array<string> {
  if (dotnetProjectPath.endsWith('.csproj')) {
    return [dotnetProjectPath];
  } else if (!dotnetProjectPath.endsWith('.sln')) {
    throw new Error(
      `The dotnet project file must have an extenstion of '.csproj' or '.sln'`
    );
  }

  const slnBuffer = readFileSync(dotnetProjectPath);

  if (slnBuffer === null) {
    throw new Error(
      `Unable to read the dotnet project file specified, '${dotnetProjectPath}'`
    );
  }

  const slnContent = slnBuffer.toString();
  const basePath = dotnetProjectPath.substring(
    0,
    dotnetProjectPath.lastIndexOf(path.sep)
  );

  return readProjectsFromSolutionContent(slnContent, basePath);
}

export function readProjectsFromSolutionContent(
  slnContent: string,
  basePath: string
): Array<string> {
  const projectLineRegex = /\nProject\(/g;
  const projLinePathRegex = /"(.*)".*"(.*)".*"(.*)"/;

  let projectLines = slnContent.split(projectLineRegex);

  projectLines.shift();
  projectLines = _.map(projectLines, (line) => {
    const match = line.match(projLinePathRegex);

    return match === null ? '' : match[2];
  });

  projectLines = _.without(projectLines, '');
  projectLines = _.map(projectLines, (line) => line.replace('\\', path.sep));
  projectLines = _.map(projectLines, (line) => path.join(basePath, line));

  return projectLines;
}

export function appendProjectLinesToSolution(
  rootSolutionContents: string,
  projectSolutionContents: string
): string {
  const startProjectLine = '\r\nProject(';
  const endProjectLine = 'EndProject\r\n';
  const startGlobalSection = '\r\nGlobal\r\n';

  const newProjectLines = projectSolutionContents.substring(
    projectSolutionContents.indexOf(startProjectLine),
    projectSolutionContents.lastIndexOf(endProjectLine) + endProjectLine.length
  );

  const fileParts = rootSolutionContents.split(startGlobalSection);
  fileParts.splice(1, 0, newProjectLines);
  fileParts.splice(2, 0, startGlobalSection.substring('\r\n'.length));

  return fileParts.join('');
}

export function appendGlobalSectionToSolution(
  rootSolutionContents: string,
  projectSolutionContents: string
): string {
  const globalSectionRegex =
    /([\s\S]*GlobalSection\(ProjectConfigurationPlatforms\) = postSolution)([\s\S]*)(\r\n\tEndGlobalSection[\s\S]*)/;

  const projectParts = globalSectionRegex.exec(projectSolutionContents);
  const rootParts = globalSectionRegex.exec(rootSolutionContents);

  rootParts.shift();
  rootParts.splice(2, 0, projectParts[2]);

  return rootParts.join('');
}

export function createTestSlnContent(
  projects: Array<{ root: string; name: string }>
): string {
  const projectSpecs = _.map(projects, (project) => {
    return {
      ...project,
      guid: Guid.create(),
    };
  });
  const projectLines = _.map(
    projectSpecs,
    (project) =>
      `Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${project.name}", "${project.root}${path.sep}${project.name}.csproj", "{${project.guid}}"\nEndProject`
  );
  const globalLines = _.map(
    projectSpecs,
    (project) => `
\t\t{${project.guid}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
\t\t{${project.guid}}.Debug|Any CPU.Build.0 = Debug|Any CPU
\t\t{${project.guid}}.Release|Any CPU.ActiveCfg = Release|Any CPU
\t\t{${project.guid}}.Release|Any CPU.Build.0 = Release|Any CPU`
  );

  return `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.30114.105
MinimumVisualStudioVersion = 10.0.40219.1
${projectLines.join('\n')}
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution\r${globalLines}\r
	EndGlobalSection
EndGlobal
  `;
}
