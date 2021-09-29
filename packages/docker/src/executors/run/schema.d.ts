export interface DockerRunExecutorSchema {
  vars: { [string]: string };
  ports: { [number]: number };
  mounts: { [string]: string };
}
