export function splitBlocks(data: Uint8Array, blockSize: number): Uint8Array[] {
    const blocks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += blockSize) {
        const block = data.slice(i, Math.min(i + blockSize, data.length));
        blocks.push(block);
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

export function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    if (a.length !== b.length) {
        throw new Error('Arrays must have same length for XOR');
    }
    
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

export function randomBytes(length: number): Uint8Array {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = Math.floor(Math.random() * 256);
    }
    return result;
}

export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function stringToBytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/\s|0x/g, '');
    if (clean.length % 2 !== 0) throw new Error('hex length must be even');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
}