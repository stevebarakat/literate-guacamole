export function formatMilliseconds(seconds: number): string {
  let ms: string | number = Math.floor((seconds * 1000) % 1000);
  let s: string | number = Math.floor(seconds % 60);
  let m: string | number = Math.floor(((seconds * 1000) / (1000 * 60)) % 60);
  let str = "";

  s = s < 10 ? "0" + s : s;
  m = m < 10 ? "0" + m : m;
  ms = ms < 10 ? "0" + ms : ms;
  str += m + ":";
  str += s + ":";
  str += ms.toString().slice(0, 2);
  return str;
}

// convert a value from one scale to another
// e.g. scale(-96, -192, 0, 0, 100) to convert
// -96 from dB (-192 - 0) to percentage (0 - 100)

export const convert = function (
  val: number,
  from1: number,
  from2: number,
  to1: number,
  to2: number
) {
  return ((val - from1) * (to2 - to1)) / (from2 - from1) + to1;
};

// convert decibels to a percentage
export const scale = function (dB: number) {
  return convert(dB, 0, 1, -100, 0);
};

// make scale logarithmic
export const logarithmically = (value: number) =>
  Math.log(value + 100) / Math.log(100);

export function roundFourth(num: number): number {
  return parseFloat((Math.round(num * 4) / 4).toFixed(2));
}

export function localStorageSet(item: string, data: string | number | object) {
  return localStorage.setItem(item, JSON.stringify(data));
}

export function localStorageGet(item: string) {
  const stringified = localStorage.getItem(item);
  return stringified && JSON.parse(stringified);
}

export function array(length: number, filler?: unknown) {
  return Array(length).fill(filler || null);
}

export function mapToObject(
  map: Map<number, { id: number; value: number; time: number }>
) {
  return Object.fromEntries(map.entries());
}

export function objectToMap(obj: object) {
  return new Map(Object.entries(obj));
}
