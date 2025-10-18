import { BasePrimalityTest } from './base-test.js';
import { MathService } from '../utils/math-service.js';


export class SolovayStrassenTest extends BasePrimalityTest {
  protected readonly probabilisticCoef = 2;
  
  protected testOnce(n: bigint, a: bigint): boolean {
    if (MathService.gcd(a, n) !== 1n) return false;
    
    const jacobi = MathService.jacobiSymbol(a, n);
    const exponent = (n - 1n) / 2n;
    const power = MathService.modPow(a, exponent, n);
    
    if (jacobi === -1) {
      return power === n - 1n;
    }
    
    return power === BigInt(jacobi);
  }
}