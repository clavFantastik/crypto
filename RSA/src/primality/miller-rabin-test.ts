import { BasePrimalityTest } from './base-test.js';
import { MathService } from '../utils/math-service.js';


export class MillerRabinTest extends BasePrimalityTest {
  protected readonly probabilisticCoef = 4;
  
  protected testOnce(n: bigint, a: bigint): boolean {
    let s = n - 1n;
    let d = 0;
    
    while (s % 2n === 0n) {
      s /= 2n;
      d++;
    }
    
    let x = MathService.modPow(a, s, n);
    if (x === 1n) return true;
    
    for (let i = 0; i < d; i++) {
      if (x === n - 1n) return true;
      x = MathService.modPow(x, 2n, n);
    }
    
    return false;
  }
}