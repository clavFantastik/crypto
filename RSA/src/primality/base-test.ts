import { IProbabilisticPrimalityTest } from './interface.js';


export abstract class BasePrimalityTest implements IProbabilisticPrimalityTest {
  protected abstract readonly probabilisticCoef: number;
  
  protected abstract testOnce(n: bigint, a: bigint): boolean;
  
  protected calculateRounds(probability: number): number {
    if (probability < 0.5 || probability >= 1) {
      throw new Error("Probability must be in range [0.5, 1)");
    }
    
    return Math.ceil(-Math.log(1.0 - probability) / Math.log(this.probabilisticCoef));
  }
  
  protected getRandomBase(n: bigint): bigint {
    const min = 2n;
    const max = n - 1n;
    
    const range = max - min + 1n;
    const randomBytes = new Uint8Array(64);
    crypto.getRandomValues(randomBytes);
    
    let result = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      result = (result << 8n) | BigInt(randomBytes[i]);
    }
    
    return min + (result % range);
  }
  
  isPrimary(n: bigint, probability: number): boolean {
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    const rounds = this.calculateRounds(probability);
    
    for (let i = 0; i < rounds; i++) {
      const base = this.getRandomBase(n);
      if (!this.testOnce(n, base)) {
        return false;
      }
    }
    
    return true;
  }
}