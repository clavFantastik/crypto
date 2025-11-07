import { RijndaelCipher } from '../RijndaelCipher';
import { GaloisFieldService } from '../../galois/GaloisFieldService';
import { hexToBytes, bytesToHex } from '../../utils/ModesUtils';

describe('RijndaelCipher — S-Boxes', () => {
  const gf = new GaloisFieldService();

  it('SBox[0x00] = 0x63; InvSBox[0x63] = 0x00 (AES modulus)', () => {
    const aes128 = new RijndaelCipher({ nb: 4, gf });
    const sbox = (aes128 as any).sboxes.getSBox();
    const invs = (aes128 as any).sboxes.getInvSBox();
    expect(sbox[0x00]).toBe(0x63);
    expect(invs[0x63]).toBe(0x00);
  });

  it('SBox[0x53] = 0xED (FIPS-197 Table 4 spot-check)', () => {
    const aes128 = new RijndaelCipher({ nb: 4, gf });
    const sbox = (aes128 as any).sboxes.getSBox();
    expect(sbox[0x53]).toBe(0xED);
  });
});

describe('RijndaelCipher — AES Known Answer Tests (Nb=4)', () => {
  const gf = new GaloisFieldService();

  test('AES-128 KAT (FIPS-197)', () => {
    const key = hexToBytes('000102030405060708090A0B0C0D0E0F');
    const pt  = hexToBytes('00112233445566778899AABBCCDDEEFF');
    const ctExpected = '69C4E0D86A7B0430D8CDB78070B4C55A';

    const aes128 = new RijndaelCipher({ nb: 4, gf });
    const rk = aes128.expandKey(key, 4);
    const ct = aes128.encryptBlock(pt, rk);
    expect(bytesToHex(ct)).toBe(ctExpected);

    const dec = aes128.decryptBlock(ct, rk);
    expect(bytesToHex(dec)).toBe(bytesToHex(pt));
  });

    test('AES-192 KAT (FIPS-197)', () => {
        const key = hexToBytes('000102030405060708090A0B0C0D0E0F1011121314151617');
        const pt  = hexToBytes('00112233445566778899AABBCCDDEEFF');
        const ctExpected = 'DDA97CA4864CDFE06EAF70A0EC0D7191';

        const aes192 = new RijndaelCipher({ nb: 4, gf });
        const rk = aes192.expandKey(key, 6);
        const ct = aes192.encryptBlock(pt, rk);
        expect(bytesToHex(ct)).toBe(ctExpected);

        const dec = aes192.decryptBlock(ct, rk);
        expect(bytesToHex(dec)).toBe(bytesToHex(pt));
    });

  test('AES-256 KAT (FIPS-197)', () => {
    const key = hexToBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F');
    const pt  = hexToBytes('00112233445566778899AABBCCDDEEFF');
    const ctExpected = '8EA2B7CA516745BFEAFC49904B496089';

    const aes256 = new RijndaelCipher({ nb: 4, gf });
    const rk = aes256.expandKey(key, 8);
    const ct = aes256.encryptBlock(pt, rk);
    expect(bytesToHex(ct)).toBe(ctExpected);

    const dec = aes256.decryptBlock(ct, rk);
    expect(bytesToHex(dec)).toBe(bytesToHex(pt));
  });
});

describe('RijndaelCipher — Nb=6,8 block sizes (Rijndael generalization)', () => {
  const gf = new GaloisFieldService();

  const makeSeq = (len: number, start = 0): Uint8Array => {
    const u = new Uint8Array(len);
    for (let i = 0; i < len; i++) u[i] = (start + i) & 0xFF;
    return u;
  };

  for (const nb of [6, 8] as const) {
    for (const nk of [4, 6, 8] as const) {
      test(`Reversibility nb=${nb}, nk=${nk}`, () => {
        const cipher = new RijndaelCipher({ nb, gf });
        const key = makeSeq(nk * 4, 0x10);
        const rk = cipher.expandKey(key, nk);

        expect(rk.nr).toBe(Math.max(nb, nk) + 6);

        const blockLen = nb * 4;
        const pt1 = makeSeq(blockLen, 0x00);
        const pt2 = makeSeq(blockLen, 0x80);
        const ct1 = cipher.encryptBlock(pt1, rk);
        const ct2 = cipher.encryptBlock(pt2, rk);
        const dec1 = cipher.decryptBlock(ct1, rk);
        const dec2 = cipher.decryptBlock(ct2, rk);

        expect(bytesToHex(dec1)).toBe(bytesToHex(pt1));
        expect(bytesToHex(dec2)).toBe(bytesToHex(pt2));

        const ct1b = cipher.encryptBlock(pt1, rk);
        expect(bytesToHex(ct1b)).toBe(bytesToHex(ct1));
      });
    }
  }
});

describe('RijndaelCipher — RoundKeys reuse and sizes', () => {
  const gf = new GaloisFieldService();

  it('RoundKeys length matches (Nr+1)*Nb*4 bytes', () => {
    const nb = 6;
    const nk = 8;
    const cipher = new RijndaelCipher({ nb: 6, gf });
    const key = new Uint8Array(nk * 4);
    const rk = cipher.expandKey(key, nk);
    expect(rk.bytes.length).toBe((rk.nr + 1) * nb * 4);
  });

  it('setRoundKeys vs expandKey consistency', () => {
    const cipher = new RijndaelCipher({ nb: 8, gf });
    const key = hexToBytes('000102030405060708090A0B0C0D0E0F' + '101112131415161718191A1B1C1D1E1F');
    const rk = cipher.expandKey(key, 8);

    const block = hexToBytes('000102030405060708090A0B0C0D0E0F' + '1011121314151617' + '18191A1B1C1D1E1F' + '2021222324252627');
    const ct = cipher.encryptBlock(block, rk);

    const cipher2 = new RijndaelCipher({ nb: 8, gf });
    cipher2.setRoundKeys(rk);
    const ct2 = cipher2.encryptBlock(block);
    expect(bytesToHex(ct2)).toBe(bytesToHex(ct));
  });
});

