import { IEncryptor } from '../../interfaces.js';
import { bitPermutation, bytesToBits, bitsToBytes } from '../../utils/bitUtils.js';
import { DES_CONSTANTS } from '../../constants/constants.js';

export class DESEncryptor implements IEncryptor {
    encryptBlock(inputBlock: Uint8Array, roundKey: Uint8Array): Uint8Array {
        if (inputBlock.length !== 4) throw new Error('inputBlock must be 4 bytes (32 bits)');
        if (roundKey.length !== 6) throw new Error('roundKey must be 6 bytes (48 bits)');

        const expanded = bitPermutation(inputBlock, DES_CONSTANTS.E, false, 1);
        const expandedBits = bytesToBits(expanded, false);
        const keyBits = bytesToBits(roundKey, false);
        const xorBits: number[] = expandedBits.map((b, i) => b ^ keyBits[i]);

        const sOutput: number[] = [];
        for (let sIndex = 0; sIndex < 8; sIndex++) {
            const chunk = xorBits.slice(sIndex * 6, sIndex * 6 + 6);
            const row = (chunk[0] << 1) | chunk[5];
            const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
            const val = DES_CONSTANTS.S[sIndex][row][col];
            sOutput.push((val >> 3) & 1);
            sOutput.push((val >> 2) & 1);
            sOutput.push((val >> 1) & 1);
            sOutput.push(val & 1);
        }

        const permutedBits = DES_CONSTANTS.P.map(pos => sOutput[pos - 1]);
        return bitsToBytes(permutedBits, false);
    }

    async encryptBlockAsync(inputBlock: Uint8Array, roundKey: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve) => {
            const result = this.encryptBlock(inputBlock, roundKey);
            resolve(result);
        });
    }
}
