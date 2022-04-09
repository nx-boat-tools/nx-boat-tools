export interface DockerRunExecutorSchema {
  buildTarget?: string;
  vars?: { [string]: string };
  ports?: { [number]: number };
  mounts?: { [string]: string };
}
