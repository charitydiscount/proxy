export async function asyncForEach(array: any[], callback: Function) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index]);
  }
}

export function flatMap(f: Function, arr: Array<any>) {
  return arr.reduce((x, y) => [...x, ...f(y)], []);
}
