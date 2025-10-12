import { FeistelNetwork } from '../../FeistelNetwork.js';
import { ISymmetricCipher, IDESAdapter } from '../../interfaces.js';
import { DESCipher } from '../DES/DESCipher.js';
import { DESKeyExpansion } from '../DES/DESKeyExpansion.js';
import { DEALKeyExpansion } from './DEALKeyExpansion.js';
import { DEALEncryptor } from './DEALEncryptor.js'


export class DESAdapter implements IDESAdapter {
    private des: DESCipher;

    constructor(key: Uint8Array) {
        this.des = new DESCipher();
        const keyExpansion = new DESKeyExpansion();
        const roundKeys = keyExpansion.generateRoundKeys(key);
        this.des.setRoundKeys(roundKeys);
    }

    get blockSize(): number { return 8; }

    encryptBlock(block: Uint8Array): Uint8Array {
        return this.des.encryptBlock(block);
    }

    decryptBlock(block: Uint8Array): Uint8Array {
        return this.des.decryptBlock(block);
    }

    async encryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (this.des.encryptBlockAsync) {
            return await this.des.encryptBlockAsync(block);
        }
        return this.encryptBlock(block);
    }

    async decryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (this.des.decryptBlockAsync) {
            return await this.des.decryptBlockAsync(block);
        }
        return this.decryptBlock(block);
    }
}

export class DEALCipher extends FeistelNetwork implements ISymmetricCipher {
    private keySize: number;

    constructor(key: Uint8Array) {
        const keySize = key.length;
        
        // DEAL поддерживает 3 размера ключей:
        if (keySize !== 16 && keySize !== 24 && keySize !== 32) {
            throw new Error('DEAL key must be 16 (DEAL-128), 24 (DEAL-192), or 32 (DEAL-256) bytes');
        }

        // 1. Генерация ключей для DEAL
        const keyExpansion = new DEALKeyExpansion();

        // 2. Адаптер DES (используем первые 8 байт ключа для DES)
        const desAdapter = new DESAdapter(key.slice(0, 8));

        // 3. F-функция DEAL
        const encryptor = new DEALEncryptor(desAdapter);
        
        
        const blockSize = 16; // 128-битные блоки (в 2 раза больше DES!)
        const rounds = keySize === 16 ? 6 : 8; // 6 раундов для DEAL-128, 8 для остальных

        super(keyExpansion, encryptor, blockSize, rounds);
        this.keySize = keySize;
        
        const roundKeys = this.generateRoundKeys(key);
        this.setRoundKeys(roundKeys);
    }

    get keySizeInfo(): string {
        return `DEAL-${this.keySize * 8}`;
    }
}