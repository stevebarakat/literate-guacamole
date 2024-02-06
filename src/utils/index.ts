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

// Convert a value from one scale to another
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

// Convert decibels to a percentage
export const scale = function (dB: number) {
  return convert(dB, 0, 1, -100, 0);
};

// Make scale logarithmic
export const logarithmically = (value: number) =>
  Math.log(value + 100) / Math.log(100);

// Array maker
export function array(length: number, filler?: unknown) {
  return Array(length).fill(filler || null);
}
