import { RSAPublicKey } from '../rsa/interface.js';
import { MathService } from '../utils/math-service.js';
import { FermatAttackResult } from './interface.js';


export class FermatAttack {
  static attack(publicKey: RSAPublicKey, maxAttempts: number = 10000): FermatAttackResult {
    const n = publicKey.modulus;
    let attempts = 0;
    
    if (n % 2n === 0n) {
      return {
        success: true,
        factors: [2n, n / 2n],
        attempts: 1
      };
    }
    
    let a = MathService.sqrt(n);
    if (a * a === n) {
      return {
        success: true,
        factors: [a, a],
        attempts: 1
      };
    }
    
    a += 1n;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const bSquared = a * a - n;
      if (bSquared < 0n) {
        a++;
        continue;
      }
      
      const b = MathService.sqrt(bSquared);
      
      if (b * b === bSquared) {
        const p = a - b;
        const q = a + b;
        
        if (p > 1n && q > 1n && p * q === n) {
          return {
            success: true,
            factors: [p, q],
            attempts
          };
        }
      }
      
      a++;
    }
    
    return {
      success: false,
      factors: null,
      attempts
    };
  }
  
  static isVulnerable(publicKey: RSAPublicKey): boolean {
    const testResult = this.attack(publicKey, 1000);
    return testResult.success;
  }
}