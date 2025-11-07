import { IRoundTransformations, ISBoxProvider, RoundKeys } from './types';
import { stateIndex, rotLeftRow, rotRightRow, getShiftOffsets } from '../utils/StateUtils';
import { IGaloisFieldService } from '../galois/types';

export class Transformations implements IRoundTransformations {
  constructor(
    private gf: IGaloisFieldService,
    private sboxes: ISBoxProvider,
    private nb: 4 | 6 | 8
  ) {}

  subBytes(state: Uint8Array) {
    const sbox = this.sboxes.getSBox();
    for (let i = 0; i < state.length; i++) state[i] = sbox[state[i]];
  }

  invSubBytes(state: Uint8Array) {
    const invs = this.sboxes.getInvSBox();
    for (let i = 0; i < state.length; i++) state[i] = invs[state[i]];
  }

  shiftRows(state: Uint8Array) {
    const nb = this.nb;
    const shifts = getShiftOffsets(nb);
    for (let r = 1; r < 4; r++) {
      const row = new Uint8Array(nb);
      for (let c = 0; c < nb; c++) row[c] = state[stateIndex(r, c, nb)];
      const rot = rotLeftRow(row, shifts[r]);
      for (let c = 0; c < nb; c++) state[stateIndex(r, c, nb)] = rot[c];
    }
  }

  invShiftRows(state: Uint8Array) {
    const nb = this.nb;
    const shifts = getShiftOffsets(nb);
    for (let r = 1; r < 4; r++) {
      const row = new Uint8Array(nb);
      for (let c = 0; c < nb; c++) row[c] = state[stateIndex(r, c, nb)];
      const rot = rotRightRow(row, shifts[r]);
      for (let c = 0; c < nb; c++) state[stateIndex(r, c, nb)] = rot[c];
    }
  }

  mixColumns(state: Uint8Array) {
    const nb = this.nb;
    const add = this.gf.add.bind(this.gf);
    const mul = this.gf.multiply.bind(this.gf);
    for (let c = 0; c < nb; c++) {
      const a0 = state[stateIndex(0, c, nb)];
      const a1 = state[stateIndex(1, c, nb)];
      const a2 = state[stateIndex(2, c, nb)];
      const a3 = state[stateIndex(3, c, nb)];
      const r0 = add(add(add(mul(0x02, a0), mul(0x03, a1)), a2), a3);
      const r1 = add(add(add(a0, mul(0x02, a1)), mul(0x03, a2)), a3);
      const r2 = add(add(add(a0, a1), mul(0x02, a2)), mul(0x03, a3));
      const r3 = add(add(add(mul(0x03, a0), a1), a2), mul(0x02, a3));
      state[stateIndex(0, c, nb)] = r0;
      state[stateIndex(1, c, nb)] = r1;
      state[stateIndex(2, c, nb)] = r2;
      state[stateIndex(3, c, nb)] = r3;
    }
  }

  invMixColumns(state: Uint8Array) {
    const nb = this.nb;
    const add = this.gf.add.bind(this.gf);
    const mul = this.gf.multiply.bind(this.gf);
    for (let c = 0; c < nb; c++) {
      const a0 = state[stateIndex(0, c, nb)];
      const a1 = state[stateIndex(1, c, nb)];
      const a2 = state[stateIndex(2, c, nb)];
      const a3 = state[stateIndex(3, c, nb)];
      const r0 = add(add(add(mul(0x0e, a0), mul(0x0b, a1)), mul(0x0d, a2)), mul(0x09, a3));
      const r1 = add(add(add(mul(0x09, a0), mul(0x0e, a1)), mul(0x0b, a2)), mul(0x0d, a3));
      const r2 = add(add(add(mul(0x0d, a0), mul(0x09, a1)), mul(0x0e, a2)), mul(0x0b, a3));
      const r3 = add(add(add(mul(0x0b, a0), mul(0x0d, a1)), mul(0x09, a2)), mul(0x0e, a3));
      state[stateIndex(0, c, nb)] = r0;
      state[stateIndex(1, c, nb)] = r1;
      state[stateIndex(2, c, nb)] = r2;
      state[stateIndex(3, c, nb)] = r3;
    }
  }

  addRoundKey(state: Uint8Array, rk: RoundKeys, round: number) {
    const nb = rk.nb;
    const add = this.gf.add.bind(this.gf);
    for (let c = 0; c < nb; c++) {
      const base = (round * nb + c) * 4;
      state[stateIndex(0, c, nb)] = add(state[stateIndex(0, c, nb)], rk.bytes[base]);
      state[stateIndex(1, c, nb)] = add(state[stateIndex(1, c, nb)], rk.bytes[base + 1]);
      state[stateIndex(2, c, nb)] = add(state[stateIndex(2, c, nb)], rk.bytes[base + 2]);
      state[stateIndex(3, c, nb)] = add(state[stateIndex(3, c, nb)], rk.bytes[base + 3]);
    }
  }
}