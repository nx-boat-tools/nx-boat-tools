export function defuse<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  return promise;
}
