import { PaddingMode } from "../constants/constants.js";
import { randomBytes } from "./bitUtils.js";


export function splitBlocks(data: Uint8Array, blockSize: number): Uint8Array[] {
    if (data.length % blockSize !== 0) {
        throw new Error(`Data length (${data.length}) must be multiple of block size (${blockSize})`);
    }
    
    const blocks: Uint8Array[] = [];

    for (let i = 0; i < data.length; i += blockSize) {
        blocks.push(data.slice(i, i + blockSize));
    }

    return blocks;
}

export function joinBlocks(blocks: Uint8Array[]): Uint8Array {
    const totalLength = blocks.reduce((sum, block) => sum + block.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const block of blocks) {
        result.set(block, offset);
        offset += block.length;
    }
    
    return result;
}

export function pad(data: Uint8Array, blockSize: number, mode: PaddingMode): Uint8Array {
    if (blockSize <= 0 || blockSize > 255) {
        throw new Error(`Invalid block size: ${blockSize}`);
    }

    const padLen = blockSize - (data.length % blockSize);
    const totalLength = data.length + padLen;
    
    const result = new Uint8Array(totalLength);
    result.set(data);

    switch (mode) {
        case PaddingMode.Zeros:
            break; // Просто оставляем нули (уже установлены в new Uint8Array)
            
        case PaddingMode.ANSI_X923:
            for (let i = data.length; i < totalLength - 1; i++) {
                result[i] = 0; // Нули
            }
            result[totalLength - 1] = padLen; // Последний байт = длина
            break;
            
        case PaddingMode.PKCS7:
            for (let i = data.length; i < totalLength; i++) {
                result[i] = padLen; // Все байты = длина дополнения
            }
            break;
            
        case PaddingMode.ISO_10126:
            const random = randomBytes(padLen - 1);
            for (let i = 0; i < padLen - 1; i++) {
                result[data.length + i] = random[i]; // Случайные байты
            }
            result[totalLength - 1] = padLen; // Последний байт = длина
            break;
    }
    
    return result;
}

export function unpad(data: Uint8Array, mode: PaddingMode): Uint8Array {
    if (data.length === 0) return data;

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
            if (padLen === 0 || padLen > data.length) {
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

