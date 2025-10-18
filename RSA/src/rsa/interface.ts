import { PrimalityTestType } from "../utils/inteface.js";


export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

export interface RSAPublicKey {
  exponent: bigint;
  modulus: bigint;
}

export interface RSAPrivateKey {
  exponent: bigint;
  modulus: bigint;
}

export interface RSAKeyGeneratorConfig {
  testType: PrimalityTestType;
  minProbability: number;
  bitLength: number;
}