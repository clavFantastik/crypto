import { IGaloisFieldService } from '../galois/types';
import { IKeyExpansion, ISBoxProvider, RoundKeys } from './types';

export class KeyExpansion implements IKeyExpansion {
  constructor(
    private gf: IGaloisFieldService,
    private sboxes: ISBoxProvider
  ) {}

  private generateRcon(count: number): Uint8Array {
    const rcon = new Uint8Array(count * 4);
    let rc = 0x01;
    for (let i = 1; i < count; i++) {
      rcon[i * 4] = rc;
      rcon[i * 4 + 1] = 0x00;
      rcon[i * 4 + 2] = 0x00;
      rcon[i * 4 + 3] = 0x00;
      rc = this.gf.multiply(rc, 0x02);
    }
    return rcon;
  }

  private subWord(word: number, sbox: Uint8Array): number {
    const b0 = sbox[(word >>> 24) & 0xff];
    const b1 = sbox[(word >>> 16) & 0xff];
    const b2 = sbox[(word >>> 8) & 0xff];
    const b3 = sbox[word & 0xff];
    return ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
  }

  private rotWord(word: number): number {
    return ((word << 8) | ((word >>> 24) & 0xff)) >>> 0;
  }

  private normalizeKeyIfNeeded(key: Uint8Array, strictSizes: boolean): Uint8Array {
    if (strictSizes) return key;

    const allowed = [16, 24, 32] as const;
    if (allowed.includes(key.length as any)) return key;

    let best: 16 | 24 | 32 = allowed[0];
    let bestDiff = Math.abs(key.length - allowed[0]);
    for (const s of allowed.slice(1)) {
      const d = Math.abs(key.length - s);
      if (d < bestDiff) { bestDiff = d; best = s; }
    }

    if (bestDiff > 1) return key;

    if (key.length < best) {
      const out = new Uint8Array(best);
      out.set(key);
      return out;
    } else {
      return key.slice(0, best);
    }
  }

  expandKey(keyIn: Uint8Array, nb: 4 | 6 | 8, nk?: 4 | 6 | 8, strictSizes: boolean = false): RoundKeys {
    const key = this.normalizeKeyIfNeeded(keyIn, strictSizes);

    let inferredNk: 4 | 6 | 8;
    const len = key.length;
    if (len === 16) inferredNk = 4;
    else if (len === 24) inferredNk = 6;
    else if (len === 32) inferredNk = 8;
    else throw new Error(`Invalid key length ${len}. Expected 16/24/32`);

    if (!nk) nk = inferredNk;
    if (nk !== inferredNk) nk = inferredNk;

    const nr = Math.max(nb, nk) + 6;

    const totalWords = (nr + 1) * nb;
    const w = new Uint32Array(totalWords);

    for (let i = 0; i < nk; i++) {
      const base = 4 * i;
      w[i] = ((key[base] << 24) | (key[base + 1] << 16) | (key[base + 2] << 8) | key[base + 3]) >>> 0;
    }

    const sbox = this.sboxes.getSBox();
    const rcon = this.generateRcon(Math.ceil(totalWords / nk) + 1);

    for (let i = nk; i < totalWords; i++) {
      let temp = w[i - 1] >>> 0;

      if (i % nk === 0) {
        const rc = (rcon[Math.floor(i / nk) * 4] << 24) >>> 0;
        temp = (this.subWord(this.rotWord(temp), sbox) ^ rc) >>> 0;
      } else if (nk === 8 && (i % nk) === 4) {
        temp = this.subWord(temp, sbox) >>> 0;
      }

      w[i] = (w[i - nk] ^ temp) >>> 0;
    }

    const rkBytes = new Uint8Array(totalWords * 4);
    for (let i = 0; i < totalWords; i++) {
      const word = w[i] >>> 0;
      const offs = i * 4;
      rkBytes[offs] = (word >>> 24) & 0xff;
      rkBytes[offs + 1] = (word >>> 16) & 0xff;
      rkBytes[offs + 2] = (word >>> 8) & 0xff;
      rkBytes[offs + 3] = word & 0xff;
    }

    return { nb, nk, nr, bytes: rkBytes };
  }
}