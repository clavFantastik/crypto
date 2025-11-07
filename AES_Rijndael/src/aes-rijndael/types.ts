import { IGaloisFieldService } from '../galois/types';

export type RoundKeys = {
  nb: number;
  nk: number;
  nr: number;
  bytes: Uint8Array;
};

export type RijndaelOptions = {
  nb: 4 | 6 | 8;
  gf: IGaloisFieldService;
  sboxProvider?: ISBoxProvider;
  strictSizes?: boolean;
};

export interface IBlockCipher {
  encryptBlock(data: Uint8Array, roundKeys?: RoundKeys): Uint8Array;
  decryptBlock(data: Uint8Array, roundKeys?: RoundKeys): Uint8Array;
  getBlockSize(): number;
  expandKey(key: Uint8Array, nk?: 4 | 6 | 8): RoundKeys;
  setRoundKeys(roundKeys: RoundKeys): void;
}

export interface IKeyExpansion {
  expandKey(key: Uint8Array, nb: 4 | 6 | 8, nk?: 4 | 6 | 8, strictSizes?: boolean): RoundKeys;
}

export interface IRoundTransformations {
  subBytes(state: Uint8Array): void;
  invSubBytes(state: Uint8Array): void;
  shiftRows(state: Uint8Array): void;
  invShiftRows(state: Uint8Array): void;
  mixColumns(state: Uint8Array): void;
  invMixColumns(state: Uint8Array): void;
  addRoundKey(state: Uint8Array, rk: RoundKeys, round: number): void;
}

export interface ISBoxProvider {
  getSBox(): Uint8Array;
  getInvSBox(): Uint8Array;
}