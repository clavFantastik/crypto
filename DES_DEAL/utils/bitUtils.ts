export function bytesToBits(bytes: Uint8Array, indexFromLSB = true): number[] {
  const bits: number[] = [];

  for (const byte of bytes) {
    if (indexFromLSB) {
      for (let i = 0; i < 8; i++) bits.push((byte >> i) & 1);
    } else {
      for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    }
  }

  return bits;
}


export function bitsToBytes(bits: number[], indexFromLSB = true): Uint8Array {
  const result: number[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8);
    const binString = indexFromLSB ? chunk.reverse().join('') : chunk.join('');
    const byte = parseInt(binString, 2);
    result.push(byte);
  }

  return new Uint8Array(result);
}


export function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    if (a.length !== b.length) {
        throw new Error(`XOR bytes: length mismatch (${a.length} vs ${b.length})`);
    }

    const out = new Uint8Array(a.length);
    
    for (let i = 0; i < a.length; i++) {
        out[i] = a[i] ^ b[i];
    }

    return out;
}


export function randomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }

    return array;
}


export function rotateLeft(arr: number[], n: number): number[] {
  const len = arr.length;
  const shift = n % len;

  return arr.slice(shift).concat(arr.slice(0, shift));
}


export function bitPermutation(
  value: Uint8Array,
  pBlock: number[],
  indexFromLSB = true,
  startAtZero = 0
): Uint8Array {
  if (startAtZero !== 0 && startAtZero !== 1) return new Uint8Array();

  const bits = bytesToBits(value, indexFromLSB);

  const outputBits: number[] = [];

  for (let i = 0; i < pBlock.length; i++) {
    outputBits[i] = bits[pBlock[i] - startAtZero];
  }

  return bitsToBytes(outputBits, indexFromLSB);
}


