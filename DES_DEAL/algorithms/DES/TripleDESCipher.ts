import { ISymmetricCipher } from '../../interfaces.js';
import { DESCipher } from './DESCipher.js';

export enum TripleDESKeyMode {
    EDE2 = 2,
    EDE3 = 3
}

export class TripleDESCipher implements ISymmetricCipher {
    readonly blockSize: number = 8;
    private des1: DESCipher;
    private des2: DESCipher;
    private des3: DESCipher;
    private keyMode: TripleDESKeyMode;

    constructor(key: Uint8Array) {
        this.validateKey(key);
        
        this.des1 = new DESCipher();
        this.des2 = new DESCipher();
        this.des3 = new DESCipher();

        if (key.length === 16) {
            this.keyMode = TripleDESKeyMode.EDE2;
            const k1 = key.slice(0, 8);
            const k2 = key.slice(8, 16);
            this.des1.setRoundKeys(this.des1.generateRoundKeys(k1));
            this.des2.setRoundKeys(this.des2.generateRoundKeys(k2));
            this.des3.setRoundKeys(this.des3.generateRoundKeys(k1));
        } else {
            this.keyMode = TripleDESKeyMode.EDE3;
            const k1 = key.slice(0, 8);
            const k2 = key.slice(8, 16);
            const k3 = key.slice(16, 24);
            this.des1.setRoundKeys(this.des1.generateRoundKeys(k1));
            this.des2.setRoundKeys(this.des2.generateRoundKeys(k2));
            this.des3.setRoundKeys(this.des3.generateRoundKeys(k3));
        }
    }

    private validateKey(key: Uint8Array): void {
        if (key.length !== 16 && key.length !== 24) {
            throw new Error('Triple DES key must be 16 bytes (2-key 3DES) or 24 bytes (3-key 3DES)');
        }
    }

    encryptBlock(block: Uint8Array): Uint8Array {
        if (block.length !== 8) {
            throw new Error('Triple DES block must be 8 bytes');
        }
        const stage1 = this.des1.encryptBlock(block);
        const stage2 = this.des2.decryptBlock(stage1);
        const stage3 = this.des3.encryptBlock(stage2);
        return stage3;
    }

    decryptBlock(block: Uint8Array): Uint8Array {
        if (block.length !== 8) {
            throw new Error('Triple DES block must be 8 bytes');
        }
        const stage1 = this.des3.decryptBlock(block);
        const stage2 = this.des2.encryptBlock(stage1);
        const stage3 = this.des1.decryptBlock(stage2);
        return stage3;
    }

    async encryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (block.length !== 8) {
            throw new Error('Triple DES block must be 8 bytes');
        }
        const stage1 = await this.des1.encryptBlockAsync(block);
        const stage2 = await this.des2.decryptBlockAsync(stage1);
        const stage3 = await this.des3.encryptBlockAsync(stage2);
        return stage3;
    }

    async decryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        if (block.length !== 8) {
            throw new Error('Triple DES block must be 8 bytes');
        }
        const stage1 = await this.des3.decryptBlockAsync(block);
        const stage2 = await this.des2.encryptBlockAsync(stage1);
        const stage3 = await this.des1.decryptBlockAsync(stage2);
        return stage3;
    }

    getKeyMode(): string {
        return this.keyMode === TripleDESKeyMode.EDE2 ? '3DES-EDE2' : '3DES-EDE3';
    }
}
