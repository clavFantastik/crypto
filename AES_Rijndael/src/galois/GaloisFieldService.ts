import { GFElement, IGaloisFieldService, Polynomial } from './types';
import { IRREDUCIBLE_POLYNOMIALS_8, AES_POLYNOMIAL } from './constants';
import { BitUtils } from '../utils/BitUtils';

export class GaloisFieldService implements IGaloisFieldService {
    private readonly modulus: Polynomial;

    constructor(modulus: Polynomial = AES_POLYNOMIAL) {
        if (!this.isIrreducible(modulus)) {
            throw new Error(`Polynomial 0x${modulus.toString(16)} is reducible over GF(2^8)`);
        }
        this.modulus = modulus;
    }

    add(a: GFElement, b: GFElement): GFElement {
        return (a ^ b) & 0xFF;
    }

    multiply(a: GFElement, b: GFElement): GFElement {
        let aa = a & 0xFF;
        let bb = b & 0xFF;
        let res = 0;
        const red = this.modulus & 0xFF;

        while (bb) {
            if (bb & 1) res ^= aa;
            const carry = aa & 0x80;
            aa = (aa << 1) & 0xFF;
            if (carry) aa ^= red;
            bb >>>= 1;
        }

        return res & 0xFF;
    }

    inverse(element: GFElement): GFElement {
        if (element === 0) {
            throw new Error("Zero element has no inverse");
        }

        if (!this.isIrreducible(this.modulus)) {
            throw new Error("Modulus is reducible over GF(2); inverse is undefined");
        }

        let r0 = this.modulus;
        let r1 = element & 0xFF;
        let t0 = 0;
        let t1 = 1;

        while (r1 !== 0) {
            const { quotient: q, remainder: rem } = BitUtils.dividePolynomials(r0, r1);
            const t = t0 ^ BitUtils.multiplyPolynomials(t1, q);
            r0 = r1;
            r1 = rem;
            t0 = t1;
            t1 = t;
        }

        if (r0 !== 1) {
            throw new Error("Element is not invertible for the given modulus");
        }

        const inv = BitUtils.dividePolynomials(t0, this.modulus).remainder;
        return inv & 0xFF;
    }

    isIrreducible(polynomial: Polynomial): boolean {
        const degree = BitUtils.polynomialDegree(polynomial);
        if (degree !== 8) {
            return false;
        }
        return IRREDUCIBLE_POLYNOMIALS_8.includes(polynomial);
    }

    getAllIrreduciblePolynomials(): Polynomial[] {
        return Array.from(IRREDUCIBLE_POLYNOMIALS_8);
    }

    factorPolynomial(polynomial: Polynomial): Polynomial[] {
        if (polynomial === 0) return [0];
        
        const degree = BitUtils.polynomialDegree(polynomial);
        if (degree < 0) return [0];
        if (degree === 0) return [polynomial];

        const factors: Polynomial[] = [];
        let remaining = polynomial;

        while ((remaining & 1) === 0) {
            factors.push(2);
            remaining >>>= 1;
        }

        if (remaining > 1) {
            if (this.isPolynomialIrreducible(remaining)) {
                factors.push(remaining);
            } else {
                const irreducibleFactors = this.factorUsingIrreduciblePolynomials(remaining);
                factors.push(...irreducibleFactors);
            }
        }

        return factors.sort((a, b) => a - b);
    }

    getModulus(): Polynomial {
        return this.modulus;
    }

    private isPolynomialIrreducible(polynomial: Polynomial): boolean {
        const degree = BitUtils.polynomialDegree(polynomial);
        
        if (degree <= 1) return true;
        if (degree === 8) return this.isIrreducible(polynomial);
        
        return this.checkIrreducibilityByTrialDivision(polynomial, degree);
    }

    private factorUsingIrreduciblePolynomials(polynomial: Polynomial): Polynomial[] {
        const factors: Polynomial[] = [];
        let remaining = polynomial;

        for (const irreducible of IRREDUCIBLE_POLYNOMIALS_8) {
            if (BitUtils.polynomialDegree(irreducible) > BitUtils.polynomialDegree(remaining)) {
                break;
            }

            while (true) {
                const division = BitUtils.dividePolynomials(remaining, irreducible);
                if (division.remainder === 0) {
                    factors.push(irreducible);
                    remaining = division.quotient;
                    
                    if (remaining === 1) {
                        return factors;
                    }
                    
                    if (this.isPolynomialIrreducible(remaining)) {
                        factors.push(remaining);
                        return factors;
                    }
                } else {
                    break;
                }
            }
        }

        if (remaining !== 1) {
            factors.push(remaining);
        }

        return factors;
    }

    private checkIrreducibilityByTrialDivision(polynomial: Polynomial, degree: number): boolean {
        if ((polynomial & 1) === 0) return false;
        if ((polynomial & 2) === 0) return false;
        
        for (let testDegree = 1; testDegree <= Math.floor(degree / 2); testDegree++) {
            const startPoly = 1 << testDegree;
            const endPoly = 1 << (testDegree + 1);
            
            for (let testPoly = startPoly | 1; testPoly < endPoly; testPoly += 2) {
                if (BitUtils.polynomialDegree(testPoly) !== testDegree) {
                    continue;
                }
                
                if (BitUtils.dividePolynomials(polynomial, testPoly).remainder === 0) {
                    return false;
                }
            }
        }
        
        return true;
    }
}