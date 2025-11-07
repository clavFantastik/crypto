import { GaloisFieldService } from '../GaloisFieldService';
import { AES_POLYNOMIAL, IRREDUCIBLE_POLYNOMIALS_8 } from '../constants';
import { BitUtils } from '../../utils/BitUtils';

type GFElement = number;
type Polynomial = number;

function multisetEquals(a: number[], b: number[]) {
  const ca = a.slice().sort((x,y)=>x-y);
  const cb = b.slice().sort((x,y)=>x-y);
  expect(ca).toEqual(cb);
}

describe('GaloisFieldService — базовая арифметика', () => {
  const gf = new GaloisFieldService(AES_POLYNOMIAL); 

  test('add: XOR по FIPS 197', () => {
    expect(gf.add(0x57, 0x83)).toBe((0x57 ^ 0x83) & 0xFF);
    expect(gf.add(0x00, 0xFF)).toBe(0xFF);
    expect(gf.add(0xAB, 0xAB)).toBe(0x00);
  });

  test('multiply: корректность по FIPS 197 (известный вектор 0x57 * 0x13 = 0xFE)', () => {
    expect(gf.multiply(0x57, 0x13)).toBe(0xFE);
  });

  test('multiply: нейтральные элементы', () => {
    for (let a = 0; a < 256; a++) {
      expect(gf.multiply(a, 0)).toBe(0);
      expect(gf.multiply(a, 1)).toBe(a);
      expect(gf.multiply(0, a)).toBe(0);
      expect(gf.multiply(1, a)).toBe(a);
    }
  });

  test('multiply: коммутативность и дистрибутивность', () => {
    for (let a = 0; a < 256; a += 17) {
      for (let b = 0; b < 256; b += 31) {
        expect(gf.multiply(a, b)).toBe(gf.multiply(b, a));
        const c = (a ^ b) & 0xFF;
        for (let x = 0; x < 256; x += 37) {
          expect(gf.multiply(c, x)).toBe(gf.add(gf.multiply(a, x), gf.multiply(b, x)));
        }
      }
    }
  });

  test('xtime (умножение на 2) и цепочка xtime соответствуют FIPS 197', () => {
    const xtime = (v: GFElement) => gf.multiply(v, 0x02);
    expect(xtime(0x57)).toBe(0xAE);
    expect(xtime(0xAE)).toBe(0x47);
  });

  test('inverse: корректность для всех ненулевых элементов под AES-полиномом', () => {
    for (let a = 1; a < 256; a++) {
      const inv = gf.inverse(a);
      expect(gf.multiply(a, inv)).toBe(1);
      expect(gf.multiply(inv, a)).toBe(1);
    }
  });

  test('inverse: zero бросает исключение', () => {
    expect(() => gf.inverse(0x00)).toThrow();
  });

  test('inverse: пример из литературы (0x53^-1 = 0xCA в AES-поле)', () => {
    const inv = gf.inverse(0x53);
    expect(inv).toBe(0xCA);
    expect(gf.multiply(0x53, inv)).toBe(1);
  });
});

describe('Модульность и проверка неприводимости', () => {
  test('Конструктор бросает исключение для приводимого модуля степени 8 (например, x^8 + 1)', () => {
    const reducible: Polynomial = 0x101; 
    expect(() => new GaloisFieldService(reducible)).toThrow();
  });

  test('isIrreducible: true для AES-полинома, false для приводимого и для не-степени 8', () => {
    const gf = new GaloisFieldService(AES_POLYNOMIAL);
    expect(gf.isIrreducible(AES_POLYNOMIAL)).toBe(true);
    expect(gf.isIrreducible(0x101)).toBe(false);
    expect(gf.isIrreducible(0x07)).toBe(false); 
  });

  test('getAllIrreduciblePolynomials: ровно 30 и содержит AES-полином', () => {
    const gf = new GaloisFieldService(AES_POLYNOMIAL);
    const polys = gf.getAllIrreduciblePolynomials();
    expect(Array.isArray(polys)).toBe(true);
    const uniq = new Set(polys);
    expect(uniq.size).toBe(30);
    expect(uniq.has(AES_POLYNOMIAL)).toBe(true);
  });
});

describe('Арифметика по произвольному корректному модулю (не AES)', () => {
  test('multiply и inverse уважают переданный неприводимый модуль', () => {
    const otherMods = IRREDUCIBLE_POLYNOMIALS_8.filter(p => p !== AES_POLYNOMIAL);
    expect(otherMods.length).toBeGreaterThan(0);
    const mod = otherMods[0];
    const gf = new GaloisFieldService(mod);

    for (let a = 1; a < 256; a += 29) {
      const inv = gf.inverse(a);
      expect(gf.multiply(a, inv)).toBe(1);
    }
  });
});

describe('Факторизация полиномов над GF(2)', () => {
  const gf = new GaloisFieldService(AES_POLYNOMIAL);

  // test('Простая факторизация: (x^2 + x + 1)(x+1)', () => {
  //   const p1 = 0b111; 
  //   const p2 = 0b11;  
  //   const composite = BitUtils.multiplyPolynomials(p1, p2);

  //   const factors = gf.factorPolynomial(composite);
  //   multisetEquals(factors, [p1, p2]);
  // });

  test('Факторизация произведения двух неприводимых степеней 8', () => {
    const polys = IRREDUCIBLE_POLYNOMIALS_8.slice(0, 3);
    expect(polys.length).toBeGreaterThanOrEqual(2);
    const f = polys[0];
    const g = polys[1];

    const composite = BitUtils.multiplyPolynomials(f, g); 
    const factors = gf.factorPolynomial(composite);

    expect(factors.includes(f)).toBe(true);
    expect(factors.includes(g)).toBe(true);
  });
});

describe('BitUtils sanity', () => {
  test('dividePolynomials корректно делит и даёт нулевой остаток на кратных', () => {
    const a = 0b111; 
    const b = 0b11;  
    const prod = BitUtils.multiplyPolynomials(a, b);
    const { remainder } = BitUtils.dividePolynomials(prod, a);
    expect(remainder).toBe(0);
  });

  test('polynomialDegree базовый', () => {
    expect(BitUtils.polynomialDegree(0)).toBe(-1);
    expect(BitUtils.polynomialDegree(1)).toBe(0);
    expect(BitUtils.polynomialDegree(2)).toBe(1);
    expect(BitUtils.polynomialDegree(0x11B)).toBe(8);
  });
});