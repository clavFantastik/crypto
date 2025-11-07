function parity8(x: number): number {
  x ^= x >>> 4;
  x ^= x >>> 2;
  x ^= x >>> 1;
  return x & 1;
}

export function matMulByte(rows: number[], x: number): number {
  let y = 0;
  for (let i = 0; i < 8; i++) {
    const bit = parity8(rows[i] & x);
    y |= bit << i;
  }
  return y & 0xff;
}

export function invertBinary8x8(rows: number[]): number[] {
  let M = rows.slice();
  let I = Array.from({ length: 8 }, (_, i) => (1 << i));

  for (let col = 0; col < 8; col++) {
    let pivot = -1;
    for (let r = col; r < 8; r++) {
      if (((M[r] >>> col) & 1) === 1) { pivot = r; break; }
    }
    if (pivot === -1) throw new Error("Affine matrix not invertible.");

    if (pivot !== col) {
      [M[col], M[pivot]] = [M[pivot], M[col]];
      [I[col], I[pivot]] = [I[pivot], I[col]];
    }
    for (let r = 0; r < 8; r++) {
      if (r !== col && ((M[r] >>> col) & 1) === 1) {
        M[r] ^= M[col];
        I[r] ^= I[col];
      }
    }
  }
  return I;
}
