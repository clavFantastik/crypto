import { GaloisFieldService } from '../galois/GaloisFieldService';
import { SBoxProvider } from './SBox';
import { KeyExpansion } from './KeyExpansion';
import { Transformations } from './Transformations';
import { IBlockCipher, IKeyExpansion, IRoundTransformations, ISBoxProvider, RijndaelOptions, RoundKeys } from './types';
import { stateToBytes, stateIndex, rotLeftRow, rotRightRow, getShiftOffsets } from '../utils/StateUtils';
import { IGaloisFieldService } from '../galois/types';

export class RijndaelCipher implements IBlockCipher {
  readonly nb: 4 | 6 | 8;
  readonly gf: IGaloisFieldService;
  private sboxes: ISBoxProvider;
  private rk?: RoundKeys;
  private strictSizes: boolean;
  
  private keyExpansion: IKeyExpansion;
  private transformations: IRoundTransformations;

  constructor(opts: RijndaelOptions) {
    this.nb = opts.nb;
    this.gf = opts.gf;
    this.sboxes = opts.sboxProvider ?? new SBoxProvider(this.gf as GaloisFieldService);
    this.strictSizes = opts.strictSizes ?? false;
    
    this.keyExpansion = new KeyExpansion(this.gf, this.sboxes as SBoxProvider);
    this.transformations = new Transformations(this.gf, this.sboxes as SBoxProvider, this.nb);
  }

  getBlockSize(): number {
    return this.nb * 4;
  }

  expandKey(keyIn: Uint8Array, nk?: 4 | 6 | 8): RoundKeys {
    const rk = this.keyExpansion.expandKey(keyIn, this.nb, nk, this.strictSizes);
    this.rk = rk;
    return rk;
  }

  setRoundKeys(rk: RoundKeys) {
    if (rk.nb !== this.nb) throw new Error(`RoundKeys.nb=${rk.nb} mismatch with cipher nb=${this.nb}`);
    this.rk = rk;
  }

  encryptBlock(data: Uint8Array, rk?: RoundKeys): Uint8Array {
    const roundKeys = rk ?? this.rk;
    if (!roundKeys) throw new Error("Round keys not set. Call expandKey() or setRoundKeys().");
    if (roundKeys.nb !== this.nb) throw new Error("Round keys nb mismatch.");

    const state = this.bytesToState(data);
    const nr = roundKeys.nr;

    this.transformations.addRoundKey(state, roundKeys, 0);

    for (let round = 1; round < nr; round++) {
      this.transformations.subBytes(state);
      this.shiftRows(state);
      this.transformations.mixColumns(state);
      this.transformations.addRoundKey(state, roundKeys, round);
    }

    this.transformations.subBytes(state);
    this.shiftRows(state);
    this.transformations.addRoundKey(state, roundKeys, nr);

    return stateToBytes(state);
  }

  decryptBlock(data: Uint8Array, rk?: RoundKeys): Uint8Array {
    const roundKeys = rk ?? this.rk;
    if (!roundKeys) throw new Error("Round keys not set. Call expandKey() or setRoundKeys().");
    if (roundKeys.nb !== this.nb) throw new Error("Round keys nb mismatch.");

    const state = this.bytesToState(data);
    const nr = roundKeys.nr;

    this.transformations.addRoundKey(state, roundKeys, nr);

    for (let round = nr - 1; round >= 1; round--) {
      this.invShiftRows(state);
      this.transformations.invSubBytes(state);
      this.transformations.addRoundKey(state, roundKeys, round);
      this.transformations.invMixColumns(state);
    }

    this.invShiftRows(state);
    this.transformations.invSubBytes(state);
    this.transformations.addRoundKey(state, roundKeys, 0);

    return stateToBytes(state);
  }

  private normalizeBlockInput(input: Uint8Array): Uint8Array {
    const expected = this.nb * 4;
    if (input.length === expected) return input;
    if (this.strictSizes) throw new Error(`Invalid block size ${input.length}, expected ${expected}`);
    if (input.length < expected) throw new Error(`Invalid block size ${input.length}, expected ${expected}`);
    return input.slice(0, expected);
  }

  private bytesToState(input: Uint8Array): Uint8Array {
    const normalized = this.normalizeBlockInput(input);
    return new Uint8Array(normalized);
  }

  private shiftRows(state: Uint8Array) {
    const nb = this.nb;
    const shifts = getShiftOffsets(nb);
    for (let r = 1; r < 4; r++) {
      const row = new Uint8Array(nb);
      for (let c = 0; c < nb; c++) row[c] = state[stateIndex(r, c, nb)];
      const rot = rotLeftRow(row, shifts[r]);
      for (let c = 0; c < nb; c++) state[stateIndex(r, c, nb)] = rot[c];
    }
  }

  private invShiftRows(state: Uint8Array) {
    const nb = this.nb;
    const shifts = getShiftOffsets(nb);
    for (let r = 1; r < 4; r++) {
      const row = new Uint8Array(nb);
      for (let c = 0; c < nb; c++) row[c] = state[stateIndex(r, c, nb)];
      const rot = rotRightRow(row, shifts[r]);
      for (let c = 0; c < nb; c++) state[stateIndex(r, c, nb)] = rot[c];
    }
  }
}