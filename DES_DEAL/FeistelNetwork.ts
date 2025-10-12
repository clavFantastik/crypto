import { IFeistelNetwork, ISymmetricCipher, IKeyExpansion, IEncryptor } from './interfaces.js';
import { xorBytes } from './utils/bitUtils.js';


export class FeistelNetwork implements IFeistelNetwork, ISymmetricCipher {
    private keyExpansion: IKeyExpansion;
    private encryptor: IEncryptor;
    private _blockSize: number;
    private _rounds: number;
    private roundKeys: Uint8Array[] = [];

    constructor(
        keyExpansion: IKeyExpansion,
        encryptor: IEncryptor,
        blockSize: number = 8,
        rounds: number = 16
    ) {
        this.keyExpansion = keyExpansion;
        this.encryptor = encryptor;
        this._blockSize = blockSize;
        this._rounds = rounds;
        this.validateParameters();
    }

    get blockSize(): number {
        return this._blockSize;
    }

    get rounds(): number {
        return this._rounds;
    }

    setRoundKeys(roundKeys: Uint8Array[]): void {
        if (!Array.isArray(roundKeys) || roundKeys.length < this._rounds) {
            throw new Error(`Expected array of at least ${this._rounds} round keys`);
        }
        this.roundKeys = roundKeys.slice();
    }

    encryptBlock(block: Uint8Array): Uint8Array {
        this.validateBlock(block);
        if (this.roundKeys.length < this._rounds) {
            throw new Error('encryptBlock: round keys not set');
        }
        return this.encryptBlockWithKeys(block, this.roundKeys);
    }

    decryptBlock(block: Uint8Array): Uint8Array {
        this.validateBlock(block);
        if (this.roundKeys.length < this._rounds) {
            throw new Error('decryptBlock: round keys not set');
        }
        return this.decryptBlockWithKeys(block, this.roundKeys);
    }

    encryptBlockWithKeys(block: Uint8Array, roundKeys: Uint8Array[]): Uint8Array {
        this.validateBlock(block);
        this.validateRoundKeys(roundKeys);

        // 1. ДЕЛЕНИЕ БЛОКА НА ПОЛОВИНЫ
        const halfSize = this._blockSize / 2;
        let L: Uint8Array = block.slice(0, halfSize);
        let R: Uint8Array = block.slice(halfSize);

        // 2. ВЫПОЛНЕНИЕ РАУНДОВ
        for (let i = 0; i < this._rounds; i++) {
            // ФОРМУЛА ФЕЙСТЕЛЯ:
            // L[i] = R[i-1]
            // R[i] = L[i-1] XOR F(R[i-1], K[i])
            const newL = R;
            const fResult = this.encryptor.encryptBlock(R, roundKeys[i]);
            const newR = xorBytes(L, fResult);
            
            L = newL;
            R = newR;
        }

        // 3. ФИНАЛЬНАЯ ПЕРЕСТАНОВКА (последний раунд без свопа)
        const result = new Uint8Array(this._blockSize);
        result.set(R, 0);
        result.set(L, halfSize);
        return result;
    }

    decryptBlockWithKeys(block: Uint8Array, roundKeys: Uint8Array[]): Uint8Array {
        this.validateBlock(block);
        this.validateRoundKeys(roundKeys);

        // ЕДИНСТВЕННОЕ ОТЛИЧИЕ - КЛЮЧИ В ОБРАТНОМ ПОРЯДКЕ!
        const reversedKeys = [...roundKeys].reverse();
        
        const halfSize = this._blockSize / 2;
        let L: Uint8Array = block.slice(0, halfSize);
        let R: Uint8Array = block.slice(halfSize);

        for (let i = 0; i < this._rounds; i++) {
            const newL = R;
            const fResult = this.encryptor.encryptBlock(R, reversedKeys[i]);
            const newR = xorBytes(L, fResult);
            
            L = newL;
            R = newR;
        }

        const result = new Uint8Array(this._blockSize);
        result.set(R, 0);
        result.set(L, halfSize);
        return result;
    }

    encryptWithKey(block: Uint8Array, masterKey: Uint8Array): Uint8Array {
        const roundKeys = this.generateRoundKeys(masterKey);
        return this.encryptBlockWithKeys(block, roundKeys);
    }

    decryptWithKey(block: Uint8Array, masterKey: Uint8Array): Uint8Array {
        const roundKeys = this.generateRoundKeys(masterKey);
        return this.decryptBlockWithKeys(block, roundKeys);
    }


    // Асинхронные методы
    async encryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        this.validateBlock(block);
        if (this.roundKeys.length < this._rounds) {
            throw new Error('encryptBlockAsync: round keys not set');
        }
        return this.encryptBlockWithKeysAsync(block, this.roundKeys);
    }

    async decryptBlockAsync(block: Uint8Array): Promise<Uint8Array> {
        this.validateBlock(block);
        if (this.roundKeys.length < this._rounds) {
            throw new Error('decryptBlockAsync: round keys not set');
        }
        return this.decryptBlockWithKeysAsync(block, this.roundKeys);
    }

    private async encryptBlockWithKeysAsync(block: Uint8Array, roundKeys: Uint8Array[]): Promise<Uint8Array> {
        this.validateBlock(block);
        this.validateRoundKeys(roundKeys);

        const halfSize = this._blockSize / 2;
        let L: Uint8Array = block.slice(0, halfSize);
        let R: Uint8Array = block.slice(halfSize);

        for (let i = 0; i < this._rounds; i++) {
            const newL = R;
            
            // БЕЗОПАСНАЯ ПРОВЕРКА перед вызовом асинхронного метода
            let fResult: Uint8Array;
            if (this.encryptor.encryptBlockAsync) {
                fResult = await this.encryptor.encryptBlockAsync(R, roundKeys[i]);
            } else {
                fResult = this.encryptor.encryptBlock(R, roundKeys[i]);
            }
            
            const newR = xorBytes(L, fResult);
            
            L = newL;
            R = newR;
        }

        const result = new Uint8Array(this._blockSize);
        result.set(R, 0);
        result.set(L, halfSize);
        return result;
    }

    private async decryptBlockWithKeysAsync(block: Uint8Array, roundKeys: Uint8Array[]): Promise<Uint8Array> {
        this.validateBlock(block);
        this.validateRoundKeys(roundKeys);

        const reversedKeys = [...roundKeys].reverse();
        const halfSize = this._blockSize / 2;
        let L: Uint8Array = block.slice(0, halfSize);
        let R: Uint8Array = block.slice(halfSize);

        for (let i = 0; i < this._rounds; i++) {
            const newL = R;
            
            // БЕЗОПАСНАЯ ПРОВЕРКА перед вызовом асинхронного метода
            let fResult: Uint8Array;
            if (this.encryptor.encryptBlockAsync) {
                fResult = await this.encryptor.encryptBlockAsync(R, reversedKeys[i]);
            } else {
                fResult = this.encryptor.encryptBlock(R, reversedKeys[i]);
            }
            
            const newR = xorBytes(L, fResult);
            
            L = newL;
            R = newR;
        }

        const result = new Uint8Array(this._blockSize);
        result.set(R, 0);
        result.set(L, halfSize);
        return result;
    }

    async encryptWithKeyAsync(block: Uint8Array, masterKey: Uint8Array): Promise<Uint8Array> {
        const roundKeys = this.generateRoundKeys(masterKey);
        return this.encryptBlockWithKeysAsync(block, roundKeys);
    }

    async decryptWithKeyAsync(block: Uint8Array, masterKey: Uint8Array): Promise<Uint8Array> {
        const roundKeys = this.generateRoundKeys(masterKey);
        return this.decryptBlockWithKeysAsync(block, roundKeys);
    }

    generateRoundKeys(masterKey: Uint8Array): Uint8Array[] {
        return this.keyExpansion.generateRoundKeys(masterKey);
    }

    private validateParameters(): void {
        if (this._blockSize <= 0 || this._blockSize % 2 !== 0) {
            throw new Error('Block size must be positive even number');
        }
        if (this._rounds <= 0) {
            throw new Error('Rounds count must be positive');
        }
    }

    private validateBlock(block: Uint8Array): void {
        if (!(block instanceof Uint8Array)) {
            throw new Error('Block must be Uint8Array');
        }
        if (block.length !== this._blockSize) {
            throw new Error(`Block size must be ${this._blockSize} bytes, got ${block.length}`);
        }
    }

    private validateRoundKeys(roundKeys: Uint8Array[]): void {
        if (!Array.isArray(roundKeys) || roundKeys.length < this._rounds) {
            throw new Error(`Expected array of at least ${this._rounds} round keys`);
        }
        for (let i = 0; i < this._rounds; i++) {
            if (!(roundKeys[i] instanceof Uint8Array)) {
                throw new Error(`Round key ${i} must be Uint8Array`);
            }
        }
    }
}