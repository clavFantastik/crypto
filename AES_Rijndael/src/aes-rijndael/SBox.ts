import { GaloisFieldService } from '../galois/GaloisFieldService';
import { IGaloisFieldService } from '../galois/types';
import { aesAffineForward, makeAesAffineInverse } from './AffineTransform';
import { ISBoxProvider } from './types';

export class SBoxProvider implements ISBoxProvider {
  private gf: IGaloisFieldService;
  private sbox?: Uint8Array;
  private invsbox?: Uint8Array;
  private invAffineFn: (b: number) => number;

  constructor(gf: GaloisFieldService) {
    this.gf = gf;
    this.invAffineFn = makeAesAffineInverse();
  }

  getSBox(): Uint8Array {
    if (!this.sbox) {
      const box = new Uint8Array(256);
      for (let a = 0; a < 256; a++) {
        const inv = (a === 0) ? 0 : this.gf.inverse(a);
        box[a] = aesAffineForward(inv);
      }
      this.sbox = box;
    }
    return this.sbox;
  }

  getInvSBox(): Uint8Array {
    if (!this.invsbox) {
      const box = new Uint8Array(256);
      for (let b = 0; b < 256; b++) {
        const pre = this.invAffineFn(b);
        const a = (pre === 0) ? 0 : this.gf.inverse(pre);
        box[b] = a;
      }
      this.invsbox = box;
    }
    return this.invsbox;
  }
}