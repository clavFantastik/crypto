import { IKeyExpansion } from '../../interfaces.js';
import { rotateLeft, bitPermutation } from '../../utils/bitUtils.js';
import { DES_CONSTANTS } from '../../constants/constants.js';

export class DESKeyExpansion implements IKeyExpansion {
    generateRoundKeys(keyBytes: Uint8Array): Uint8Array[] {
        if (keyBytes.length !== 8) {
            throw new Error("DES key must be 8 bytes");
        }

        const permuted = bitPermutation(keyBytes, DES_CONSTANTS.PC1, false, 1);
        const bits = Array.from(permuted).flatMap(byte =>
            Array.from({ length: 8 }, (_, j) => (byte >> (7 - j)) & 1)
        );

        let C = bits.slice(0, 28);
        let D = bits.slice(28, 56);
        const roundKeys: Uint8Array[] = [];

        for (let i = 0; i < 16; i++) {
            C = rotateLeft(C, DES_CONSTANTS.SHIFTS[i]);
            D = rotateLeft(D, DES_CONSTANTS.SHIFTS[i]);
            const CD = C.concat(D);
            const rkBits = DES_CONSTANTS.PC2.map(pos => CD[pos - 1]);
            const rkBytes = new Uint8Array(
                rkBits.reduce((acc, bit, idx) => {
                    const byteIndex = Math.floor(idx / 8);
                    acc[byteIndex] = (acc[byteIndex] << 1) | bit;
                    return acc;
                }, new Array(6).fill(0))
            );
            roundKeys.push(rkBytes);
        }

        return roundKeys;
    }
}
