import * as _ from 'underscore';
import * as path from 'path';
import { Guid } from 'guid-typescript';

export function getAllProjectsFromSolution(
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

export function createTestSlnContent(projectNames: Array<string>): string {
  const projectLines = _.map(
    projectNames,
    (project) =>
      `Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${project}", "${project}\\${project}.csproj", "{${Guid.create()}}"\nEndProject`
  );

  return `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio 15
${projectLines.join('\n')}
  `;
}
