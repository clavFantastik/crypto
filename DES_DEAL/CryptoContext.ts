import { pad, unpad, splitBlocks, joinBlocks } from './utils/blockUtils.js';
import { xorBytes } from './utils/bitUtils.js';
import { CipherMode, PaddingMode } from './constants/constants.js';

export class CryptoContext {
    private blockSize: number;

    constructor(
        public cipher: any,
        public mode: CipherMode,
        public padding: PaddingMode,
        public iv: Uint8Array | null = null
    ) {
        this.blockSize = cipher.blockSize;
        this.validateParameters();
    }

    private validateParameters(): void {
        if (this.mode !== CipherMode.ECB) {
            if (!this.iv) {
                throw new Error(`IV is required for ${CipherMode[this.mode]} mode`);
            }
            if (this.iv.length !== this.blockSize) {
                throw new Error(`IV length must be ${this.blockSize} bytes, got ${this.iv.length}`);
            }
        }
    }

    encrypt(data: Uint8Array): Uint8Array {
        const paddedData = pad(data, this.blockSize, this.padding);
        const blocks = splitBlocks(paddedData, this.blockSize);
        const encryptedBlocks = this.encryptBlocks(blocks);
        return joinBlocks(encryptedBlocks);
    }

    decrypt(data: Uint8Array): Uint8Array {
        if (data.length % this.blockSize !== 0) {
            throw new Error(`Encrypted data length must be multiple of block size (${this.blockSize})`);
        }
        
        const blocks = splitBlocks(data, this.blockSize);
        const decryptedBlocks = this.decryptBlocks(blocks);
        const decryptedData = joinBlocks(decryptedBlocks);
        return unpad(decryptedData, this.padding);
    }

    private encryptBlocks(blocks: Uint8Array[]): Uint8Array[] {
        switch (this.mode) {
            case CipherMode.ECB: return this.encryptECB(blocks);
            case CipherMode.CBC: return this.encryptCBC(blocks);
            case CipherMode.PCBC: return this.encryptPCBC(blocks);
            case CipherMode.CFB: return this.encryptCFB(blocks);
            case CipherMode.OFB: return this.encryptOFB(blocks);
            case CipherMode.CTR: return this.encryptCTR(blocks);
            case CipherMode.RandomDelta: return this.encryptRandomDelta(blocks);
            default: throw new Error(`Unsupported encryption mode: ${this.mode}`);
        }
    }

    private decryptBlocks(blocks: Uint8Array[]): Uint8Array[] {
        switch (this.mode) {
            case CipherMode.ECB: return this.decryptECB(blocks);
            case CipherMode.CBC: return this.decryptCBC(blocks);
            case CipherMode.PCBC: return this.decryptPCBC(blocks);
            case CipherMode.CFB: return this.decryptCFB(blocks);
            case CipherMode.OFB: return this.decryptOFB(blocks);
            case CipherMode.CTR: return this.decryptCTR(blocks);
            case CipherMode.RandomDelta: return this.decryptRandomDelta(blocks);
            default: throw new Error(`Unsupported decryption mode: ${this.mode}`);
        }
    }

    async encryptAsync(data: Uint8Array): Promise<Uint8Array> {
        const paddedData = pad(data, this.blockSize, this.padding);
        const blocks = splitBlocks(paddedData, this.blockSize);
        const encryptedBlocks = await this.encryptBlocksAsync(blocks);
        return joinBlocks(encryptedBlocks);
    }

    async decryptAsync(data: Uint8Array): Promise<Uint8Array> {
        if (data.length % this.blockSize !== 0) {
            throw new Error(`Encrypted data length must be multiple of block size (${this.blockSize})`);
        }
        
        const blocks = splitBlocks(data, this.blockSize);
        const decryptedBlocks = await this.decryptBlocksAsync(blocks);
        const decryptedData = joinBlocks(decryptedBlocks);
        return unpad(decryptedData, this.padding);
    }

    private async encryptBlocksAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        switch (this.mode) {
            case CipherMode.ECB: return await this.encryptECBAsync(blocks);
            case CipherMode.CTR: return await this.encryptCTRAsync(blocks);
            case CipherMode.OFB: return await this.encryptOFBAsync(blocks);
            case CipherMode.RandomDelta: return await this.encryptRandomDeltaAsync(blocks);
            default: return this.encryptBlocks(blocks);
        }
    }

    private async decryptBlocksAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        switch (this.mode) {
            case CipherMode.ECB: return await this.decryptECBAsync(blocks);
            case CipherMode.CTR: return await this.decryptCTRAsync(blocks);
            case CipherMode.OFB: return await this.decryptOFBAsync(blocks);
            case CipherMode.RandomDelta: return await this.decryptRandomDeltaAsync(blocks);
            default: return this.decryptBlocks(blocks);
        }
    }

    private async processParallel(blocks: Uint8Array[], encrypt: boolean): Promise<Uint8Array[]> {
        const promises = blocks.map((block, index) => 
            this.processBlockAsync(block, index, encrypt)
        );
        return await Promise.all(promises);
    }

    private async processBlockAsync(block: Uint8Array, index: number, encrypt: boolean): Promise<Uint8Array> {
        const syncMethod = encrypt ? 'encryptBlock' : 'decryptBlock';
        const asyncMethod = encrypt ? 'encryptBlockAsync' : 'decryptBlockAsync';
        
        if (this.cipher[asyncMethod]) {
            return await this.cipher[asyncMethod](block);
        } else {
            return this.cipher[syncMethod](block);
        }
    }

    private async encryptECBAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        return await this.processParallel(blocks, true);
    }

    private async decryptECBAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        return await this.processParallel(blocks, false);
    }

    private async encryptCTRAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        const counters = this.generateCounters(blocks.length);
        
        const keystreamPromises = counters.map(counter => {
            if (this.cipher.encryptBlockAsync) {
                return this.cipher.encryptBlockAsync(counter);
            } else {
                return Promise.resolve(this.cipher.encryptBlock(counter));
            }
        });
        
        const keystreams = await Promise.all(keystreamPromises);
        const resultPromises = blocks.map(async (block, i) => xorBytes(block, keystreams[i]));
        return await Promise.all(resultPromises);
    }

    private async decryptCTRAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        return await this.encryptCTRAsync(blocks);
    }

    private async encryptOFBAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        let keystream = this.iv!;
        const result: Uint8Array[] = [];

        for (const block of blocks) {
            if (this.cipher.encryptBlockAsync) {
                keystream = await this.cipher.encryptBlockAsync(keystream);
            } else {
                keystream = this.cipher.encryptBlock(keystream);
            }
            result.push(xorBytes(block, keystream));
        }

        return result;
    }

    private async decryptOFBAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        return await this.encryptOFBAsync(blocks);
    }

    private async encryptRandomDeltaAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        const counters = this.generateCounters(blocks.length);

        const promises = counters.map(async (counter, i) => {
            const delta = this.generateDelta(counter);
            const modifiedCounter = xorBytes(counter, delta);
            
            let keystream: Uint8Array;
            if (this.cipher.encryptBlockAsync) {
                keystream = await this.cipher.encryptBlockAsync(modifiedCounter);
            } else {
                keystream = this.cipher.encryptBlock(modifiedCounter);
            }
            
            return xorBytes(blocks[i], keystream);
        });
        
        return await Promise.all(promises);
    }

    private async decryptRandomDeltaAsync(blocks: Uint8Array[]): Promise<Uint8Array[]> {
        return await this.encryptRandomDeltaAsync(blocks);
    }

    private processECB(blocks: Uint8Array[], encrypt: boolean): Uint8Array[] {
        const method = encrypt ? 'encryptBlock' : 'decryptBlock';
        return blocks.map(block => this.cipher[method](block));
    }

    private processCBC(blocks: Uint8Array[], encrypt: boolean): Uint8Array[] {
        const result: Uint8Array[] = [];
        let previousBlock = this.iv!;

        if (encrypt) {
            for (const block of blocks) {
                const xored = xorBytes(block, previousBlock);
                const processed = this.cipher.encryptBlock(xored);
                result.push(processed);
                previousBlock = processed;
            }
        } else {
            for (const block of blocks) {
                const decrypted = this.cipher.decryptBlock(block);
                const plaintext = xorBytes(decrypted, previousBlock);
                result.push(plaintext);
                previousBlock = block;
            }
        }

        return result;
    }

    private processPCBC(blocks: Uint8Array[], encrypt: boolean): Uint8Array[] {
        const result: Uint8Array[] = [];
        let feedback = this.iv!;

        if (encrypt) {
            for (const block of blocks) {
                const xored = xorBytes(block, feedback);
                const encrypted = this.cipher.encryptBlock(xored);
                result.push(encrypted);
                feedback = xorBytes(block, encrypted);
            }
        } else {
            for (const block of blocks) {
                const decrypted = this.cipher.decryptBlock(block);
                const plaintext = xorBytes(decrypted, feedback);
                result.push(plaintext);
                feedback = xorBytes(plaintext, block);
            }
        }

        return result;
    }

    private processCFB(blocks: Uint8Array[], encrypt: boolean): Uint8Array[] {
        const result: Uint8Array[] = [];
        let shiftRegister = this.iv!;

        for (const block of blocks) {
            const keystream = this.cipher.encryptBlock(shiftRegister);
            const processed = xorBytes(block, keystream);
            result.push(processed);
            shiftRegister = encrypt ? processed : block;
        }

        return result;
    }

    private processOFB(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let keystream = this.iv!;

        for (const block of blocks) {
            keystream = this.cipher.encryptBlock(keystream);
            result.push(xorBytes(block, keystream));
        }

        return result;
    }

    private processCTR(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let counter = this.iv!;

        for (const block of blocks) {
            const keystream = this.cipher.encryptBlock(counter);
            result.push(xorBytes(block, keystream));
            counter = this.incrementCounter(counter);
        }

        return result;
    }

    private processRandomDelta(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let counter = this.iv!;

        for (const block of blocks) {
            const delta = this.generateDelta(counter);
            const modifiedCounter = xorBytes(counter, delta);
            const keystream = this.cipher.encryptBlock(modifiedCounter);
            result.push(xorBytes(block, keystream));
            counter = this.incrementCounter(counter);
        }

        return result;
    }

    private encryptECB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processECB(blocks, true);
    }

    private decryptECB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processECB(blocks, false);
    }

    private encryptCBC(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCBC(blocks, true);
    }

    private decryptCBC(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCBC(blocks, false);
    }

    private encryptPCBC(blocks: Uint8Array[]): Uint8Array[] {
        return this.processPCBC(blocks, true);
    }

    private decryptPCBC(blocks: Uint8Array[]): Uint8Array[] {
        return this.processPCBC(blocks, false);
    }

    private encryptCFB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCFB(blocks, true);
    }

    private decryptCFB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCFB(blocks, false);
    }

    private encryptOFB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processOFB(blocks);
    }

    private decryptOFB(blocks: Uint8Array[]): Uint8Array[] {
        return this.processOFB(blocks);
    }

    private encryptCTR(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCTR(blocks);
    }

    private decryptCTR(blocks: Uint8Array[]): Uint8Array[] {
        return this.processCTR(blocks);
    }

    private encryptRandomDelta(blocks: Uint8Array[]): Uint8Array[] {
        return this.processRandomDelta(blocks);
    }

    private decryptRandomDelta(blocks: Uint8Array[]): Uint8Array[] {
        return this.processRandomDelta(blocks);
    }

    private generateCounters(count: number): Uint8Array[] {
        const counters: Uint8Array[] = [];
        let currentCounter = this.iv!;

        for (let i = 0; i < count; i++) {
            counters.push(new Uint8Array(currentCounter));
            currentCounter = this.incrementCounter(currentCounter);
        }

        return counters;
    }

    private generateDelta(counter: Uint8Array): Uint8Array {
        const delta = new Uint8Array(this.blockSize);
        
        for (let i = 0; i < this.blockSize; i++) {
            delta[i] = (counter[i] * 17 + i * 13) % 256;
        }
        
        return delta;
    }

    private incrementCounter(counter: Uint8Array): Uint8Array {
        const result = new Uint8Array(counter);
        
        for (let i = result.length - 1; i >= 0; i--) {
            if (result[i] === 255) {
                result[i] = 0;
            } else {
                result[i]++;
                break;
            }
        }
        
        return result;
    }
}
