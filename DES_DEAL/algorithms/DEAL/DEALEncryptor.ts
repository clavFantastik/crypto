import { IEncryptor, IDESAdapter } from '../../interfaces.js';
import { xorBytes } from '../../utils/bitUtils.js';


export class DEALEncryptor implements IEncryptor {
    constructor(private desAdapter: IDESAdapter) {}

    encryptBlock(inputBlock: Uint8Array, roundKey: Uint8Array): Uint8Array {
        // F-функция DEAL: XOR + DES-шифрование F(R, K) = DES(R ⊕ K)
        const xored = xorBytes(inputBlock, roundKey);
        return this.desAdapter.encryptBlock(xored);
    }

    async encryptBlockAsync(inputBlock: Uint8Array, roundKey: Uint8Array): Promise<Uint8Array> {
        const xored = xorBytes(inputBlock, roundKey);
        
        // Используем асинхронный DES если доступен
        if (this.desAdapter.encryptBlockAsync) {
            return await this.desAdapter.encryptBlockAsync(xored);
        } else {
            // Фолбэк на синхронную версию
            return this.desAdapter.encryptBlock(xored);
        }
    }
}