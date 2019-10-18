export async function asyncForEach(array: any[], callback: Function) {
  for (const item of array) {
    await callback(item);
  }
}

export function flatMap(f: Function, arr: Array<any>) {
  return arr.reduce((x, y) => [...x, ...f(y)], []);
}
