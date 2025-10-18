import { BasePrimalityTest } from './base-test.js';
import { MathService } from '../utils/math-service.js';


export class FermatTest extends BasePrimalityTest {
  protected readonly probabilisticCoef = 2;
  
  protected testOnce(n: bigint, a: bigint): boolean {
    if (MathService.gcd(a, n) !== 1n) return false;
    
    return MathService.modPow(a, n - 1n, n) === 1n;
  }
}