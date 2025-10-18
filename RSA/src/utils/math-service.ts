import { BigIntLike, Rational, IMathService } from './inteface.js';


export class MathService implements IMathService {
  // 1. Символ Лежандра
  static legendreSymbol(a: BigIntLike, p: BigIntLike): number {
    const aBig = BigInt(a);
    const pBig = BigInt(p);
    
    if (pBig < 2n) throw new Error("p must be >= 2");
    if (pBig % 2n === 0n) throw new Error("p must be odd");
    
    const result = this.jacobiSymbol(aBig, pBig);
    return result;
  }

  // 2. Символ Якоби
  static jacobiSymbol(a: BigIntLike, n: BigIntLike): number {
    let aVal = BigInt(a);
    let nVal = BigInt(n);
    
    if (nVal < 2n) throw new Error("n must be >= 2");
    if (nVal % 2n === 0n) throw new Error("n must be odd");
    
    if (this.gcd(aVal, nVal) !== 1n) return 0;
    
    let result = 1;
    
    // Обработка отрицательного a
    if (aVal < 0n) {
      aVal = -aVal;
      if (nVal % 4n === 3n) result *= -1;
    }
    
    while (aVal !== 0n) {
      let t = 0;
      while ((aVal & 1n) === 0n) {
        t++;
        aVal >>= 1n;
      }
      if ((t & 1) === 1) {
        const mod8 = nVal % 8n;
        if (mod8 === 3n || mod8 === 5n) result *= -1;
      }
      if (aVal % 4n === 3n && nVal % 4n === 3n) result *= -1;
      
      [aVal, nVal] = [nVal % aVal, aVal];
    }
    
    return nVal === 1n ? result : 0;
  }

  // 3. Алгоритм Евклида
  static gcd(a: BigIntLike, b: BigIntLike): bigint {
    let x = BigInt(a);
    let y = BigInt(b);
    x = x < 0n ? -x : x;
    y = y < 0n ? -y : y;
    
    while (y !== 0n) {
      [x, y] = [y, x % y];
    }
    return x;
  }

  // 4. Расширенный алгоритм Евклида
  static egcd(a: BigIntLike, b: BigIntLike): [bigint, bigint, bigint] {
    let aVal = BigInt(a);
    let bVal = BigInt(b);
    
    if (aVal === 0n) return [bVal, 0n, 1n];
    
    const [gcd, x1, y1] = this.egcd(bVal % aVal, aVal);
    const x = y1 - (bVal / aVal) * x1;
    const y = x1;
    
    return [gcd, x, y];
  }

  // 5. Возведение в степень по модулю
  static modPow(base: BigIntLike, exponent: BigIntLike, modulus: BigIntLike): bigint {
    let baseVal = BigInt(base);
    let expVal = BigInt(exponent);
    const modVal = BigInt(modulus);
    
    if (expVal < 0n) throw new Error("Exponent must be non-negative");
    
    baseVal = ((baseVal % modVal) + modVal) % modVal;
    
    let result = 1n;
    
    while (expVal > 0n) {
      if (expVal & 1n) {
        result = (result * baseVal) % modVal;
      }
      baseVal = (baseVal * baseVal) % modVal;
      expVal >>= 1n;
    }
    
    return result;
  }

  // Вспомогательные методы для непрерывных дробей
  static continuedFraction(x: Rational): bigint[] {
    const result: bigint[] = [];
    let remainder = { ...x };
    
    while (true) {
      const integerPart = remainder.numerator / remainder.denominator;
      result.push(integerPart);
      
      remainder = {
        numerator: remainder.numerator - integerPart * remainder.denominator,
        denominator: remainder.denominator
      };
      
      if (remainder.numerator === 0n) break;
      
      [remainder.numerator, remainder.denominator] = 
        [remainder.denominator, remainder.numerator];
    }
    
    return result;
  }

  static calculateConvergents(cf: bigint[]): Rational[] {
    const result: Rational[] = [];
    if (cf.length === 0) return result;

    let p1 = 0n, q1 = 1n;
    let p0 = 1n, q0 = 0n;

    for (const a of cf) {
      const p = a * p0 + p1;
      const q = a * q0 + q1;
      
      result.push({ numerator: p, denominator: q });
      
      p1 = p0;
      q1 = q0;
      p0 = p;
      q0 = q;
    }
    
    return result;
  }

  // Вспомогательный метод для вычисления квадратного корня
  static sqrt(value: bigint): bigint {
    if (value < 0n) throw new Error("Negative value");
    if (value < 2n) return value;
    
    let x = value;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + value / x) / 2n;
    }
    
    return x;
  }

  legendreSymbol(a: BigIntLike, p: BigIntLike): number {
    return MathService.legendreSymbol(a, p);
  }

  jacobiSymbol(a: BigIntLike, n: BigIntLike): number {
    return MathService.jacobiSymbol(a, n);
  }

  gcd(a: BigIntLike, b: BigIntLike): bigint {
    return MathService.gcd(a, b);
  }

  egcd(a: BigIntLike, b: BigIntLike): [bigint, bigint, bigint] {
    return MathService.egcd(a, b);
  }

  modPow(base: BigIntLike, exponent: BigIntLike, modulus: BigIntLike): bigint {
    return MathService.modPow(base, exponent, modulus);
  }

  continuedFraction(x: Rational): bigint[] {
    return MathService.continuedFraction(x);
  }

  calculateConvergents(cf: bigint[]): Rational[] {
    return MathService.calculateConvergents(cf);
  }

  sqrt(value: bigint): bigint {
    return MathService.sqrt(value);
  }
}