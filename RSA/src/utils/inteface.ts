export type BigIntLike = bigint | number | string;
export type Rational = { numerator: bigint; denominator: bigint };

export enum PrimalityTestType {
  FERMAT = "fermat",
  SOLOVAY_STRASSEN = "solovay_strassen", 
  MILLER_RABIN = "miller_rabin"
}


export interface IMathService {
  legendreSymbol(a: BigIntLike, p: BigIntLike): number;
  jacobiSymbol(a: BigIntLike, n: BigIntLike): number;
  gcd(a: BigIntLike, b: BigIntLike): bigint;
  egcd(a: BigIntLike, b: BigIntLike): [bigint, bigint, bigint];
  modPow(base: BigIntLike, exponent: BigIntLike, modulus: BigIntLike): bigint;
  continuedFraction(x: Rational): bigint[];
  calculateConvergents(cf: bigint[]): Rational[];
  sqrt(value: bigint): bigint;
}