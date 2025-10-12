import { FeistelNetwork } from '../../FeistelNetwork.js';
import { DESKeyExpansion } from './DESKeyExpansion.js';
import { DESEncryptor } from './DESEncryptor.js';
import { ISymmetricCipher } from '../../interfaces.js';


export class DESCipher extends FeistelNetwork implements ISymmetricCipher {
    constructor() {
        const keyExpansion = new DESKeyExpansion();
        const encryptor = new DESEncryptor();

        // Наследуем от FeistelNetwork: 8 байт блок, 16 раундов
        super(keyExpansion, encryptor, 8, 16);
    }
}