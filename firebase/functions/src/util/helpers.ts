export async function asyncForEach(array: any[], callback: Function) {
  for (const item of array) {
    await callback(item);
  }
}

export function flatMap(f: Function, arr: Array<any>) {
  return arr.reduce((x, y) => [...x, ...f(y)], []);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const pick = (
  obj: { [key: string]: any },
  props: string[],
): { [key: string]: any } | undefined => {
  if (!obj || !props) return;

  const picked = {} as { [key: string]: any };

  props.forEach((prop) => {
    if (obj.hasOwnProperty(prop)) {
      picked[prop] = obj[prop];
    }
  });

  return picked;
};
