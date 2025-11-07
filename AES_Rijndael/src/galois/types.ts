export type GFElement = number;
export type Polynomial = number;

export interface IGaloisFieldService {
    add(a: GFElement, b: GFElement): GFElement;
    multiply(a: GFElement, b: GFElement): GFElement;
    inverse(element: GFElement): GFElement;
    isIrreducible(polynomial: Polynomial): boolean;
    getAllIrreduciblePolynomials(degree?: number): Polynomial[];
    factorPolynomial(polynomial: Polynomial): Polynomial[];
}