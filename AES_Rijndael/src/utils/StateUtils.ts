export function stateIndex(r: number, c: number, nb: number): number {
  return c * 4 + r;
}

export function stateToBytes(state: Uint8Array): Uint8Array {
  return new Uint8Array(state);
}

export function rotLeftRow(row: Uint8Array, shift: number): Uint8Array {
  const n = row.length;
  const r = new Uint8Array(n);
  for (let i = 0; i < n; i++) r[i] = row[(i + (shift % n)) % n];
  return r;
}

export function rotRightRow(row: Uint8Array, shift: number): Uint8Array {
  const n = row.length;
  const r = new Uint8Array(n);
  for (let i = 0; i < n; i++) r[i] = row[(i + n - (shift % n)) % n];
  return r;
}

export function getShiftOffsets(nb: number): [number, number, number, number] {
  if (nb === 4) return [0, 1, 2, 3];
  if (nb === 6) return [0, 1, 2, 3];
  if (nb === 8) return [0, 1, 3, 4];
  throw new Error(`Unsupported Nb=${nb}. Allowed: 4,6,8`);
}