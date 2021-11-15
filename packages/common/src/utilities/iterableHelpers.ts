export async function* promiseToAsyncIterator<T extends { success: boolean }>(
  v: Promise<T>
): AsyncIterableIterator<T> {
  yield await v;
}

export async function asyncIteratorToArray<T>(
  asyncIterator: AsyncIterableIterator<T>
): Promise<Array<T>> {
  const results: Array<T> = [];

  for await (const i of asyncIterator) results.push(i);

  return results;
}
