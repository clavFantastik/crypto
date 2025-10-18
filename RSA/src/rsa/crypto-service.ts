import { RSAKeyPair, RSAPublicKey, RSAKeyGeneratorConfig } from './interface.js';
import { RSAKeyGenerator } from './key-generation.js';
import { MathService } from '../utils/math-service.js';


export class RSACryptoService {
  private keyPair: RSAKeyPair | null = null;
  private keyGenerator: RSAKeyGenerator;
  
  constructor(config: RSAKeyGeneratorConfig) {
    this.keyGenerator = new RSAKeyGenerator(config);
  }
  
  async generateKeyPair(): Promise<void> {
    this.keyPair = await this.keyGenerator.generateKeyPair();
  }
  
  async generateWeakKeyPair(): Promise<void> {
    this.keyPair = await this.keyGenerator.generateWeakKeyPair();
  }
  
  async generateWeakKeyPairForFermat(): Promise<void> {
    this.keyPair = await this.keyGenerator.generateWeakKeyPairForFermat();
  }
  
  encrypt(data: bigint): bigint {
    if (!this.keyPair) {
      throw new Error("Key pair not generated");
    }
    
    const { modulus, exponent } = this.keyPair.publicKey;
    
    if (data >= modulus) {
      throw new Error("Data must be less than modulus");
    }
    
    if (data === 1n || MathService.gcd(data, modulus) !== 1n) {
      throw new Error("Data must be coprime with modulus and not equal to 1");
    }
    
    return MathService.modPow(data, exponent, modulus);
  }
  
  decrypt(data: bigint): bigint {
    if (!this.keyPair) {
      throw new Error("Key pair not generated");
    }
    
    const { modulus, exponent } = this.keyPair.privateKey;
    
    if (data >= modulus) {
      throw new Error("Data must be less than modulus");
    }
    
    return MathService.modPow(data, exponent, modulus);
  }
  
  getPublicKey(): RSAPublicKey | null {
    return this.keyPair?.publicKey ?? null;
  }
  
  setPublicKey(publicKey: RSAPublicKey): void {
    if (!this.keyPair) {
      this.keyPair = {} as RSAKeyPair;
    }
    this.keyPair.publicKey = publicKey;
  }
  
  getPrivateKey() {
    return this.keyPair?.privateKey ?? null;
  }
}