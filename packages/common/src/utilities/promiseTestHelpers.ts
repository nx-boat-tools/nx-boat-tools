export function defuse<T>(promise: Promise<T>): Promise<T> {
  promise.catch((err) => console.log(`\nCaught Error: ${err}`));
  return promise;
}
