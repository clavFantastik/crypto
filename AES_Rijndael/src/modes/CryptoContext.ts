import { CipherMode, PaddingMode } from './constants';
import { IBlockCipher } from '../aes-rijndael/types';
import { splitBlocks, joinBlocks, xorBytes, randomBytes } from '../utils/ModesUtils';

export class CryptoContext {
    private blockSize: number;

    constructor(
        public cipher: IBlockCipher,
        public mode: CipherMode,
        public padding: PaddingMode,
        public iv: Uint8Array | null = null
    ) {
        this.blockSize = cipher.getBlockSize();
        this.validateParameters();
    }

    private validateParameters(): void {
        if (this.mode !== CipherMode.ECB && this.mode !== CipherMode.CTR) {
            if (!this.iv) {
                throw new Error(`IV is required for ${this.mode} mode`);
            }
            if (this.iv.length !== this.blockSize) {
                throw new Error(`IV length must be ${this.blockSize} bytes, got ${this.iv.length}`);
            }
        }
    }

    encrypt(data: Uint8Array): Uint8Array {
        const paddedData = this.pad(data, this.padding);
        const blocks = splitBlocks(paddedData, this.blockSize);
        const encryptedBlocks = this.encryptBlocks(blocks);
        return joinBlocks(encryptedBlocks);
    }

    decrypt(data: Uint8Array): Uint8Array {
        const blocks = splitBlocks(data, this.blockSize);
        const decryptedBlocks = this.decryptBlocks(blocks);
        const decryptedData = joinBlocks(decryptedBlocks);
        return this.unpad(decryptedData, this.padding);
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

    private encryptECB(blocks: Uint8Array[]): Uint8Array[] {
        return blocks.map(block => this.cipher.encryptBlock(block));
    }

    private decryptECB(blocks: Uint8Array[]): Uint8Array[] {
        return blocks.map(block => this.cipher.decryptBlock(block));
    }

    private encryptCBC(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let previousBlock = this.iv!;

        for (const block of blocks) {
            const xored = xorBytes(block, previousBlock);
            const encrypted = this.cipher.encryptBlock(xored);
            result.push(encrypted);
            previousBlock = encrypted;
        }

        return result;
    }

    private decryptCBC(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let previousBlock = this.iv!;

        for (const block of blocks) {
            const decrypted = this.cipher.decryptBlock(block);
            const plaintext = xorBytes(decrypted, previousBlock);
            result.push(plaintext);
            previousBlock = block;
        }

        return result;
    }

    private encryptPCBC(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let feedback = this.iv!;

        for (const block of blocks) {
            const xored = xorBytes(block, feedback);
            const encrypted = this.cipher.encryptBlock(xored);
            result.push(encrypted);
            feedback = xorBytes(block, encrypted);
        }

        return result;
    }

    private decryptPCBC(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let feedback = this.iv!;

        for (const block of blocks) {
            const decrypted = this.cipher.decryptBlock(block);
            const plaintext = xorBytes(decrypted, feedback);
            result.push(plaintext);
            feedback = xorBytes(plaintext, block);
        }

        return result;
    }

    private encryptCFB(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let shiftRegister = this.iv!;

        for (const block of blocks) {
            const keystream = this.cipher.encryptBlock(shiftRegister);
            
            const effectiveKeystream = block.length === this.blockSize 
                ? keystream 
                : keystream.slice(0, block.length);
            
            const encrypted = xorBytes(block, effectiveKeystream);
            result.push(encrypted);
            
            if (encrypted.length === this.blockSize) {
                shiftRegister = encrypted;
            } else {
                const newShiftRegister = new Uint8Array(this.blockSize);
                newShiftRegister.set(encrypted);
                shiftRegister = newShiftRegister;
            }
        }

        return result;
    }

    private decryptCFB(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let shiftRegister = this.iv!;

        for (const block of blocks) {
            const keystream = this.cipher.encryptBlock(shiftRegister);
            
            const effectiveKeystream = block.length === this.blockSize 
                ? keystream 
                : keystream.slice(0, block.length);
            
            const decrypted = xorBytes(block, effectiveKeystream);
            result.push(decrypted);
            
            if (block.length === this.blockSize) {
                shiftRegister = block;
            } else {
                const newShiftRegister = new Uint8Array(this.blockSize);
                newShiftRegister.set(block);
                shiftRegister = newShiftRegister;
            }
        }

        return result;
    }

    private encryptOFB(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let keystream = this.iv!;

        for (const block of blocks) {
            keystream = this.cipher.encryptBlock(keystream);
            
            const effectiveKeystream = block.length === this.blockSize 
                ? keystream 
                : keystream.slice(0, block.length);
            
            result.push(xorBytes(block, effectiveKeystream));
        }

        return result;
    }

    private decryptOFB(blocks: Uint8Array[]): Uint8Array[] {
        return this.encryptOFB(blocks); 
    }

    private encryptCTR(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let counter: Uint8Array = this.iv ? new Uint8Array(this.iv) : new Uint8Array(this.blockSize);

        for (const block of blocks) {
            const keystream = this.cipher.encryptBlock(counter);
            
            const effectiveKeystream = block.length === this.blockSize 
                ? keystream 
                : keystream.slice(0, block.length);
            
            result.push(xorBytes(block, effectiveKeystream));
            counter = this.incrementCounter(counter);
        }

        return result;
    }

    private decryptCTR(blocks: Uint8Array[]): Uint8Array[] {
        return this.encryptCTR(blocks); 
    }

    private encryptRandomDelta(blocks: Uint8Array[]): Uint8Array[] {
        const result: Uint8Array[] = [];
        let counter: Uint8Array = this.iv ? new Uint8Array(this.iv) : new Uint8Array(this.blockSize);

        for (const block of blocks) {
            const delta = this.generateDelta(counter);
            const modifiedCounter = xorBytes(counter, delta);
            const keystream = this.cipher.encryptBlock(modifiedCounter);
            
            const effectiveKeystream = block.length === this.blockSize 
                ? keystream 
                : keystream.slice(0, block.length);
            
            result.push(xorBytes(block, effectiveKeystream));
            counter = this.incrementCounter(counter);
        }

        return result;
    }

    private decryptRandomDelta(blocks: Uint8Array[]): Uint8Array[] {
        return this.encryptRandomDelta(blocks); 
    }

private pad(data: Uint8Array, mode: PaddingMode): Uint8Array {
    if (mode === PaddingMode.NONE) {
        return data;
    }

    const blockSize = this.blockSize;
    const padLen = blockSize - (data.length % blockSize);
    const totalLength = data.length + (padLen === blockSize ? 0 : padLen);
    
    const result = new Uint8Array(totalLength);
    result.set(data);
    
    if (padLen !== blockSize) {
        switch (mode) {
            case PaddingMode.Zeros:
                break;
                
            case PaddingMode.ANSI_X923:
                for (let i = data.length; i < totalLength - 1; i++) {
                    result[i] = 0;
                }
                result[totalLength - 1] = padLen;
                break;
                
            case PaddingMode.PKCS7:
                for (let i = data.length; i < totalLength; i++) {
                    result[i] = padLen;
                }
                break;
                
            case PaddingMode.ISO_10126:
                const randomPad = randomBytes(padLen - 1);
                for (let i = 0; i < padLen - 1; i++) {
                    result[data.length + i] = randomPad[i];
                }
                result[totalLength - 1] = padLen;
                break;
        }
    }
    
    return result;
}

    private unpad(data: Uint8Array, mode: PaddingMode): Uint8Array {
        if (mode === PaddingMode.NONE || data.length === 0) {
            return data;
        }

        switch (mode) {
            case PaddingMode.Zeros:
                let endIndex = data.length;
                while (endIndex > 0 && data[endIndex - 1] === 0) {
                    endIndex--;
                }
                return data.slice(0, endIndex);
                
            case PaddingMode.ANSI_X923:
            case PaddingMode.PKCS7:
            case PaddingMode.ISO_10126:
                const padLen = data[data.length - 1];
                if (padLen === 0 || padLen > data.length || padLen > this.blockSize) {
                    throw new Error(`Invalid padding length: ${padLen}`);
                }
                
                if (mode === PaddingMode.PKCS7) {
                    for (let i = data.length - padLen; i < data.length; i++) {
                        if (data[i] !== padLen) {
                            throw new Error("Invalid PKCS7 padding");
                        }
                    }
                } else if (mode === PaddingMode.ANSI_X923) {
                    for (let i = data.length - padLen; i < data.length - 1; i++) {
                        if (data[i] !== 0) {
                            throw new Error("Invalid ANSI X.923 padding");
                        }
                    }
                }
                
                return data.slice(0, data.length - padLen);
                
            default:
                return data;
        }
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

    private generateDelta(counter: Uint8Array): Uint8Array {
        const delta = new Uint8Array(this.blockSize);
        
        for (let i = 0; i < this.blockSize; i++) {
            delta[i] = (counter[i] * 17 + i * 13) % 256;
        }
        
        return delta;
    }
}