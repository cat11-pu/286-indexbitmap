// bitrange.js：区间应用与游程统计
export function paint(bits, from, to, value) {
  const length = bits.length;
  if (!Number.isInteger(from) || !Number.isInteger(to)
      || from < 0 || to > length || from > to) {
    const error = new Error("range out of bounds or endpoints reversed");
    error.code = "E_RANGE";
    throw error;
  }
  const next = bits.slice();
  const bit = value ? 1 : 0;
  for (let i = from; i < to; i += 1) next[i] = bit;
  return next;
}

export function runsOf(bits) {
  const runs = [];
  let start = -1;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === 1) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      runs.push([start, i]);
      start = -1;
    }
  }
  if (start !== -1) runs.push([start, bits.length]);
  return runs;
}
