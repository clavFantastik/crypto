import { IEncryptor } from '../../interfaces.js';
import { bitPermutation, bytesToBits, bitsToBytes } from '../../utils/bitUtils.js';
import { DES_CONSTANTS } from '../../constants/constants.js';


export class DESEncryptor implements IEncryptor {
    /** Начальная перестановка IP */
    initialPermutation(block: Uint8Array): Uint8Array {
        if (block.length !== 8) throw new Error('IP block must be 8 bytes (64 bits)');
        return bitPermutation(block, DES_CONSTANTS.IP, false, 8);
    }

    /** Конечная перестановка IP^-1 */
    finalPermutation(block: Uint8Array): Uint8Array {
        if (block.length !== 8) throw new Error('IP^-1 block must be 8 bytes (64 bits)');
        return bitPermutation(block, DES_CONSTANTS.IP_INV, false, 8);
    }

    /**  Функция Фейстеля (F-функция)  **/
    encryptBlock(inputBlock: Uint8Array, roundKey: Uint8Array): Uint8Array {
        if (inputBlock.length !== 4) throw new Error('inputBlock must be 4 bytes (32 bits)');
        if (roundKey.length !== 6) throw new Error('roundKey must be 6 bytes (48 bits)');

        // 1. Расширяющая перестановка E (32 бита → 48 бит)
        const expanded = bitPermutation(inputBlock, DES_CONSTANTS.E, false, 1);

        // 2. XOR с раундовым ключом
        const expandedBits = bytesToBits(expanded, false);
        const keyBits = bytesToBits(roundKey, false);
        const xorBits: number[] = expandedBits.map((b, i) => b ^ keyBits[i]);

        // 3. S-блоки (48 бит → 32 бита)
        const sOutput: number[] = [];
        for (let sIndex = 0; sIndex < 8; sIndex++) {
            const chunk = xorBits.slice(sIndex * 6, sIndex * 6 + 6);

            // Берем первый и последний бит для строки
            const row = (chunk[0] << 1) | chunk[5];

            // Берем средние 4 бита для столбца
            const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];

            // Получаем значение из S-блока
            const val = DES_CONSTANTS.S[sIndex][row][col];

            // Преобразуем 4-битное значение в 4 бита
            sOutput.push((val >> 3) & 1);
            sOutput.push((val >> 2) & 1);
            sOutput.push((val >> 1) & 1);
            sOutput.push(val & 1);
        }

        // 4. Перестановка P
        const permutedBits = DES_CONSTANTS.P.map(pos => sOutput[pos - 1]);

        return bitsToBytes(permutedBits, false);
    }

    async encryptBlockAsync(inputBlock: Uint8Array, roundKey: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve) => {
            const result = this.encryptBlock(inputBlock, roundKey);
            resolve(result);
        });
    }
}