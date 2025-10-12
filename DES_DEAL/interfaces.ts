export interface IKeyExpansion {
    generateRoundKeys(keyBytes: Uint8Array): Uint8Array[];
}

export interface IEncryptor {
    encryptBlock(inputBlock: Uint8Array, roundKey: Uint8Array): Uint8Array;
    encryptBlockAsync?(inputBlock: Uint8Array, roundKey: Uint8Array): Promise<Uint8Array>;
}

export interface ISymmetricCipher {
    readonly blockSize: number;
    encryptBlock(block: Uint8Array): Uint8Array;
    decryptBlock(block: Uint8Array): Uint8Array;
    encryptBlockAsync?(block: Uint8Array): Promise<Uint8Array>;
    decryptBlockAsync?(block: Uint8Array): Promise<Uint8Array>;
}

export interface IFeistelNetwork extends ISymmetricCipher {
    readonly rounds: number;
    setRoundKeys(roundKeys: Uint8Array[]): void;
    generateRoundKeys(masterKey: Uint8Array): Uint8Array[];
    encryptWithKey(block: Uint8Array, masterKey: Uint8Array): Uint8Array;
    decryptWithKey(block: Uint8Array, masterKey: Uint8Array): Uint8Array;
    encryptWithKeyAsync?(block: Uint8Array, masterKey: Uint8Array): Promise<Uint8Array>;
    decryptWithKeyAsync?(block: Uint8Array, masterKey: Uint8Array): Promise<Uint8Array>;
}

export interface IDESAdapter {
    readonly blockSize: number;
    encryptBlock(block: Uint8Array): Uint8Array;
    decryptBlock(block: Uint8Array): Uint8Array;
    encryptBlockAsync?(block: Uint8Array): Promise<Uint8Array>;
    decryptBlockAsync?(block: Uint8Array): Promise<Uint8Array>;
}