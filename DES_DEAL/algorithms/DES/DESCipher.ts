import { FeistelNetwork } from '../../FeistelNetwork.js';
import { DESKeyExpansion } from './DESKeyExpansion.js';
import { DESEncryptor } from './DESEncryptor.js';
import { ISymmetricCipher } from '../../interfaces.js';
import { bitPermutation } from '../../utils/bitUtils.js';
import { DES_CONSTANTS } from '../../constants/constants.js';

export class DESCipher implements ISymmetricCipher {
    private feistel: FeistelNetwork;
    readonly blockSize: number = 8;

    constructor() {
        const keyExpansion = new DESKeyExpansion();
        const encryptor = new DESEncryptor();
        this.feistel = new FeistelNetwork(keyExpansion, encryptor, 8, 16);
    }

    setRoundKeys(roundKeys: Uint8Array[]): void {
        this.feistel.setRoundKeys(roundKeys);
    }

    generateRoundKeys(masterKey: Uint8Array): Uint8Array[] {
        return this.feistel.generateRoundKeys(masterKey);
    }

    encryptBlock(block: Uint8Array): Uint8Array {
        if (block.length !== 8) {
            throw new Error('DES block must be 8 bytes');
        }
        const afterIP = bitPermutation(block, DES_CONSTANTS.IP, false, 1);
        const afterFeistel = this.feistel.encryptBlock(afterIP);
        return bitPermutation(afterFeistel, DES_CONSTANTS.IP_INV, false, 1);
    }

    decryptBlock(block: Uint8Array): Uint8Array {
        if (block.length !== 8) {
            throw new Error('DES block must be 8 bytes');
        }
        const afterIP = bitPermutation(block, DES_CONSTANTS.IP, false, 1);
        const afterFeistel = this.feistel.decryptBlock(afterIP);
        return bitPermutation(afterFeistel, DES_CONSTANTS.IP_INV, false, 1);
    }

    async encryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (block.length !== 8) {
            throw new Error('DES block must be 8 bytes');
        }
        const afterIP = bitPermutation(block, DES_CONSTANTS.IP, false, 1);
        const afterFeistel = await this.feistel.encryptBlockAsync(afterIP);
        return bitPermutation(afterFeistel, DES_CONSTANTS.IP_INV, false, 1);
    }

    async decryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (block.length !== 8) {
            throw new Error('DES block must be 8 bytes');
        }
        const afterIP = bitPermutation(block, DES_CONSTANTS.IP, false, 1);
        const afterFeistel = await this.feistel.decryptBlockAsync(afterIP);
        return bitPermutation(afterFeistel, DES_CONSTANTS.IP_INV, false, 1);
    }
}
