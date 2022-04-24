export function defuse<T>(promise: Promise<T>, outputError = false): Promise<T> {
  promise.catch((err) => {
    if(outputError) {
      console.log(`\nCaught Error: ${err}`);
    }
  });
  return promise;
}
