import { RSACryptoService } from '../rsa/crypto-service.js';
import { MathService } from '../utils/math-service.js';
import { Rational } from '../utils/inteface.js';
import { WienerAttackResult } from './interface.js';


export class WienerAttack {
  static attack(rsaService: RSACryptoService): WienerAttackResult {
    const publicKey = rsaService.getPublicKey();
    if (!publicKey) {
      throw new Error("No public key available");
    }
    
    const { exponent: e, modulus: n } = publicKey;
    const eOverN: Rational = { numerator: e, denominator: n };
    
    const continuedFraction = MathService.continuedFraction(eOverN);
    const convergents = MathService.calculateConvergents(continuedFraction);
    
    for (const convergent of convergents) {
      const { success, phi } = this.testConvergent(n, e, convergent);
      if (success) {
        return {
          success: true,
          privateExponent: convergent.denominator,
          phi,
          convergents
        };
      }
    }
    
    return {
      success: false,
      privateExponent: null,
      phi: null,
      convergents
    };
  }
  
  private static testConvergent(
    n: bigint, 
    e: bigint, 
    convergent: Rational
  ): { success: boolean; phi: bigint | null } {
    const k = convergent.numerator;
    const d = convergent.denominator;
    
    if (k === 0n || d === 0n) return { success: false, phi: null };
    if ((e * d - 1n) % k !== 0n) return { success: false, phi: null };
    
    const phi = (e * d - 1n) / k;
    
    const b = n - phi + 1n;
    const discriminant = b * b - 4n * n;
    
    if (discriminant < 0n) return { success: false, phi: null };
    
    const root = MathService.sqrt(discriminant);
    if (root * root !== discriminant) return { success: false, phi: null };
    
    const p = (b + root) / 2n;
    const q = (b - root) / 2n;
    
    if (p > 1n && q > 1n && p * q === n) {
      return { success: true, phi };
    }
    
    return { success: false, phi: null };
  }
}