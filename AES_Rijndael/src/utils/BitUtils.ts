export class BitUtils {
    static polynomialDegree(polynomial: number): number {
        if (polynomial === 0) return -1;
        let degree = 0;
        let temp = polynomial;
        while (temp > 0) {
            degree++;
            temp >>>= 1;
        }
        return degree - 1;
    }

    static dividePolynomials(dividend: number, divisor: number): { quotient: number; remainder: number } {
        if (divisor === 0) throw new Error("Division by zero");
        
        let quotient = 0;
        let remainder = dividend;
        const divisorDegree = this.polynomialDegree(divisor);
        
        while (this.polynomialDegree(remainder) >= divisorDegree) {
            const shift = this.polynomialDegree(remainder) - divisorDegree;
            quotient ^= (1 << shift);
            remainder ^= (divisor << shift);
        }
        
        return { quotient, remainder };
    }

    static polynomialGCD(a: number, b: number): number {
        while (b !== 0) {
            const temp = b;
            b = this.dividePolynomials(a, b).remainder;
            a = temp;
        }
        return a;
    }

    static multiplyPolynomials(a: number, b: number): number {
        let result = 0;
        for (let i = 0; i < 32; i++) {
            if (b & (1 << i)) {
                result ^= (a << i);
            }
        }
        return result;
    }
}