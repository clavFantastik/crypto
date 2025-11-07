import { invertBinary8x8, matMulByte } from "../utils/BinaryMatrixUtils";

export function aesAffineForward(x: number): number {
  x &= 0xff;
  let y = 0;
  for (let i = 0; i < 8; i++) {
    const bit =
      ((x >>> i) & 1) ^
      ((x >>> ((i + 4) & 7)) & 1) ^
      ((x >>> ((i + 5) & 7)) & 1) ^
      ((x >>> ((i + 6) & 7)) & 1) ^
      ((x >>> ((i + 7) & 7)) & 1) ^
      ((0x63 >>> i) & 1);
    y |= bit << i;
  }
  return y & 0xff;
}

function makeAesAffineM(): number[] {
  const rows: number[] = new Array(8).fill(0);
  for (let i = 0; i < 8; i++) {
    let row = 0;
    [i, i + 4, i + 5, i + 6, i + 7].forEach(j => { row |= (1 << (j & 7)); });
    rows[i] = row & 0xff;
  }
  return rows;
}

export function makeAesAffineInverse(): (b: number) => number {
  const M = makeAesAffineM();
  const Minv = invertBinary8x8(M);
  return (b: number) => {
    b &= 0xff;
    const u = b ^ 0x63;
    return matMulByte(Minv, u);
  };
}