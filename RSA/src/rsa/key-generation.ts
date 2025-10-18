import { RSAKeyPair, RSAKeyGeneratorConfig, RSAPublicKey, RSAPrivateKey } from './interface.js';
import { PrimalityTestType } from '../utils/inteface.js';
import { MathService } from '../utils/math-service.js';
import { IProbabilisticPrimalityTest } from '../primality/interface.js';
import { FermatTest } from '../primality/fermat-test.js';
import { SolovayStrassenTest } from '../primality/solovay-strassen-test.js';
import { MillerRabinTest } from '../primality/miller-rabin-test.js';


export class RSAKeyGenerator {
  private readonly test: IProbabilisticPrimalityTest;
  
  constructor(private config: RSAKeyGeneratorConfig) {
    this.test = this.createPrimalityTest(config.testType);
  }
  
  private createPrimalityTest(testType: PrimalityTestType): IProbabilisticPrimalityTest {
    switch (testType) {
      case PrimalityTestType.FERMAT:
        return new FermatTest();
      case PrimalityTestType.SOLOVAY_STRASSEN:
        return new SolovayStrassenTest();
      case PrimalityTestType.MILLER_RABIN:
        return new MillerRabinTest();
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }
  
  private generatePrimeCandidate(): bigint {
    const min = 1n << BigInt(this.config.bitLength - 1); 
    const max = (min << 1n) - 1n;
    
    const range = max - min + 1n;
    const randomBytes = new Uint8Array(256);
    crypto.getRandomValues(randomBytes);
    
    let result = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      result = (result << 8n) | BigInt(randomBytes[i]);
    }
    
    // Делаем нечетным
    let candidate = min + (result % range);
    candidate |= 1n;
    
    // Устанавливаем старшие биты для нужной длины
    const setMask = 0xFFn << BigInt(this.config.bitLength - 8);
    candidate |= setMask;
    
    return candidate;
  }
  
  private async generatePrime(): Promise<bigint> {
    while (true) {
      const candidate = this.generatePrimeCandidate();
      if (this.test.isPrimary(candidate, this.config.minProbability)) {
        return candidate;
      }
    }
  }
  
  private isFermatAttackResistant(p: bigint, q: bigint): boolean {
    const minDiff = MathService.sqrt(MathService.sqrt(p * q)) * 2n;
    const diff = p > q ? p - q : q - p;
    
    return diff > minDiff;
  }
  
  private isWienerAttackResistant(d: bigint, n: bigint): boolean {
    const nSqrt = MathService.sqrt(MathService.sqrt(n));
    return d * 3n > nSqrt;
  }
  
  private async generatePrimePair(): Promise<[bigint, bigint]> {
    let p: bigint, q: bigint;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      if (attempts++ > maxAttempts) {
        throw new Error("Failed to generate resistant prime pair");
      }
      
      [p, q] = await Promise.all([
        this.generatePrime(),
        this.generatePrime()
      ]);
      
      // Требования к паре (p, q)
    } while (p === q || 
             MathService.gcd(p, q) !== 1n || 
             !this.isFermatAttackResistant(p, q));
    
    return [p, q];
  }
  
  async generateKeyPair(): Promise<RSAKeyPair> {
    const [p, q] = await this.generatePrimePair();
    const modulus = p * q;
    const phi = (p - 1n) * (q - 1n);
    
    const standardExponents = [65537n, 257n, 17n];
    let publicExponent: bigint = 65537n;
    let privateExponent: bigint | null = null;
    
    for (const e of standardExponents) {
      if (MathService.gcd(e, phi) === 1n) {
        const [, x] = MathService.egcd(e, phi);
        let d = ((x % phi) + phi) % phi;
        
        if (this.isWienerAttackResistant(d, modulus)) {
          publicExponent = e;
          privateExponent = d;
          break;
        }
      }
    }
    
    if (!privateExponent) {
      while (true) {
        const range = phi - 3n + 1n;
        const randomBytes = new Uint8Array(128);
        crypto.getRandomValues(randomBytes);
        
        let e = 0n;
        for (let i = 0; i < randomBytes.length; i++) {
          e = (e << 8n) | BigInt(randomBytes[i]);
        }
        
        e = 3n + (e % range);
        e |= 1n;
        
        if (MathService.gcd(e, phi) === 1n) {
          const [, x] = MathService.egcd(e, phi);
          const d = ((x % phi) + phi) % phi;
          
          if (this.isWienerAttackResistant(d, modulus)) {
            publicExponent = e;
            privateExponent = d;
            break;
          }
        }
      }
    }
    
    return {
      publicKey: { exponent: publicExponent, modulus },
      privateKey: { exponent: privateExponent!, modulus }
    };
  }
  
  async generateWeakKeyPair(): Promise<RSAKeyPair> {
    const [p, q] = await this.generatePrimePair();
    const modulus = p * q;
    const phi = (p - 1n) * (q - 1n);
    
    const maxD = MathService.sqrt(MathService.sqrt(modulus)) / 3n;
    
    let d: bigint;
    do {
      const range = maxD - 3n + 1n;
      const randomBytes = new Uint8Array(64);
      crypto.getRandomValues(randomBytes);
      
      d = 0n;
      for (let i = 0; i < randomBytes.length; i++) {
        d = (d << 8n) | BigInt(randomBytes[i]);
      }
      
      d = 3n + (d % range);
    } while (MathService.gcd(d, phi) !== 1n);
    
    const [, x] = MathService.egcd(d, phi);
    const e = ((x % phi) + phi) % phi;
    
    return {
      publicKey: { exponent: e, modulus },
      privateKey: { exponent: d, modulus }
    };
  }
  
  async generateWeakKeyPairForFermat(): Promise<RSAKeyPair> {
    let p = await this.generatePrime();
    let q: bigint;
    
    const diff = 1n << 20n;
    let attempts = 0;
    
    do {
      attempts++;
      if (attempts > 100) {
        p = await this.generatePrime();
        attempts = 0;
      }
      
      q = p + diff;
      if (q % 2n === 0n) q += 1n;
      
    } while (!this.test.isPrimary(q, this.config.minProbability));
    
    const modulus = p * q;
    const phi = (p - 1n) * (q - 1n);
    
    const publicExponent = 65537n;
    const [, x] = MathService.egcd(publicExponent, phi);
    const privateExponent = ((x % phi) + phi) % phi;
    
    return {
      publicKey: { exponent: publicExponent, modulus },
      privateKey: { exponent: privateExponent, modulus }
    };
  }
}