import { IKeyExpansion } from '../../interfaces.js';
import { DESCipher } from '../DES/DESCipher.js';
import { DESKeyExpansion } from '../DES/DESKeyExpansion.js';
import { xorBytes } from '../../utils/bitUtils.js';


export class DEALKeyExpansion implements IKeyExpansion {
    generateRoundKeys(keyBytes: Uint8Array): Uint8Array[] {
        const keySize = keyBytes.length;
        const rounds = keySize === 32 ? 8 : 6;

        const des = new DESCipher();
        const desKeyExpansion = new DESKeyExpansion();
        const desRoundKeys = desKeyExpansion.generateRoundKeys(keyBytes.slice(0, 8));
        des.setRoundKeys(desRoundKeys);
        
        const roundKeys: Uint8Array[] = [];
        let R: Uint8Array = new Uint8Array(8); 
        
        if (keySize === 16) {
            const K2 = keyBytes.slice(8, 16);
            for (let i = 0; i < rounds; i++) {
                const xored = xorBytes(K2, R);
                const roundKey = des.encryptBlock(xored);
                roundKeys.push(roundKey);
                R = roundKey;
            }
        } else if (keySize === 24) {
            const K2 = keyBytes.slice(8, 16);
            const K3 = keyBytes.slice(16, 24);
            for (let i = 0; i < rounds; i++) {
                const K = i < 6 ? K2 : K3;
                const xored = xorBytes(K, R);
                const roundKey = des.encryptBlock(xored);
                roundKeys.push(roundKey);
                R = roundKey;
            }
        } else {
            const K2 = keyBytes.slice(8, 16);
            const K3 = keyBytes.slice(16, 24);
            const K4 = keyBytes.slice(24, 32);
            for (let i = 0; i < rounds; i++) {
                const K = (i % 4 === 0) ? K2 : 
                         (i % 4 === 1) ? K3 : 
                         (i % 4 === 2) ? K4 : K2;
                const xored = xorBytes(K, R);
                const roundKey = des.encryptBlock(xored);
                roundKeys.push(roundKey);
                R = roundKey;
            }
        }
        
        return roundKeys;
    }
}