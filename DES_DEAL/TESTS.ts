import { DESCipher } from './algorithms/DES/DESCipher.js';
import { TripleDESCipher } from './algorithms/DES/TripleDESCipher.js';
import { DEALCipher } from './algorithms/DEAL/DEALCipher.js';
import { CryptoContext } from './CryptoContext.js';
import { CipherMode, PaddingMode } from './constants/constants.js';
import { randomBytes } from './utils/bitUtils.js';

function testDES() {
    console.log('=== DES Test ===');
    const key = new Uint8Array([0x13, 0x34, 0x57, 0x79, 0x9B, 0xBC, 0xDF, 0xF1]);
    const plaintext = new TextEncoder().encode('Hello DES!');
    
    const des = new DESCipher();
    const roundKeys = des.generateRoundKeys(key);
    des.setRoundKeys(roundKeys);
    
    const iv = randomBytes(8);
    const context = new CryptoContext(des, CipherMode.CBC, PaddingMode.PKCS7, iv);
    
    const encrypted = context.encrypt(plaintext);
    const decrypted = context.decrypt(encrypted);
    const result = new TextDecoder().decode(decrypted);
    
    console.log('Original:', 'Hello DES!');
    console.log('Decrypted:', result);
    console.log('Success:', result === 'Hello DES!');
}

function testTripleDES() {
    console.log('\n=== Triple DES Test ===');
    const key2 = randomBytes(16);
    const key3 = randomBytes(24);
    const plaintext = new TextEncoder().encode('Hello 3DES!');
    
    console.log('\n3DES-EDE2 (16 bytes key):');
    const des2 = new TripleDESCipher(key2);
    const iv2 = randomBytes(8);
    const context2 = new CryptoContext(des2, CipherMode.CBC, PaddingMode.PKCS7, iv2);
    const encrypted2 = context2.encrypt(plaintext);
    const decrypted2 = context2.decrypt(encrypted2);
    const result2 = new TextDecoder().decode(decrypted2);
    console.log('Mode:', des2.getKeyMode());
    console.log('Original:', 'Hello 3DES!');
    console.log('Decrypted:', result2);
    console.log('Success:', result2 === 'Hello 3DES!');
    
    console.log('\n3DES-EDE3 (24 bytes key):');
    const des3 = new TripleDESCipher(key3);
    const iv3 = randomBytes(8);
    const context3 = new CryptoContext(des3, CipherMode.CBC, PaddingMode.PKCS7, iv3);
    const encrypted3 = context3.encrypt(plaintext);
    const decrypted3 = context3.decrypt(encrypted3);
    const result3 = new TextDecoder().decode(decrypted3);
    console.log('Mode:', des3.getKeyMode());
    console.log('Original:', 'Hello 3DES!');
    console.log('Decrypted:', result3);
    console.log('Success:', result3 === 'Hello 3DES!');
}

function testDEAL() {
    console.log('\n=== DEAL Test ===');
    const plaintext = new TextEncoder().encode('Hello DEAL!');
    
    console.log('\nDEAL-128 (16 bytes key):');
    const key128 = randomBytes(16);
    const deal128 = new DEALCipher(key128);
    const iv128 = randomBytes(16);
    const context128 = new CryptoContext(deal128, CipherMode.CBC, PaddingMode.PKCS7, iv128);
    const encrypted128 = context128.encrypt(plaintext);
    const decrypted128 = context128.decrypt(encrypted128);
    const result128 = new TextDecoder().decode(decrypted128);
    console.log('Mode:', deal128.keySizeInfo);
    console.log('Original:', 'Hello DEAL!');
    console.log('Decrypted:', result128);
    console.log('Success:', result128 === 'Hello DEAL!');
    
    console.log('\nDEAL-192 (24 bytes key):');
    const key192 = randomBytes(24);
    const deal192 = new DEALCipher(key192);
    const iv192 = randomBytes(16);
    const context192 = new CryptoContext(deal192, CipherMode.CBC, PaddingMode.PKCS7, iv192);
    const encrypted192 = context192.encrypt(plaintext);
    const decrypted192 = context192.decrypt(encrypted192);
    const result192 = new TextDecoder().decode(decrypted192);
    console.log('Mode:', deal192.keySizeInfo);
    console.log('Original:', 'Hello DEAL!');
    console.log('Decrypted:', result192);
    console.log('Success:', result192 === 'Hello DEAL!');
    
    console.log('\nDEAL-256 (32 bytes key):');
    const key256 = randomBytes(32);
    const deal256 = new DEALCipher(key256);
    const iv256 = randomBytes(16);
    const context256 = new CryptoContext(deal256, CipherMode.CBC, PaddingMode.PKCS7, iv256);
    const encrypted256 = context256.encrypt(plaintext);
    const decrypted256 = context256.decrypt(encrypted256);
    const result256 = new TextDecoder().decode(decrypted256);
    console.log('Mode:', deal256.keySizeInfo);
    console.log('Original:', 'Hello DEAL!');
    console.log('Decrypted:', result256);
    console.log('Success:', result256 === 'Hello DEAL!');
}

function testAllModes() {
    console.log('\n=== Testing All Modes ===');
    const key = randomBytes(16);
    const des = new TripleDESCipher(key);
    const plaintext = new TextEncoder().encode('Testing modes!');
    
    const modes = [
        CipherMode.ECB,
        CipherMode.CBC,
        CipherMode.PCBC,
        CipherMode.CFB,
        CipherMode.OFB,
        CipherMode.CTR,
        CipherMode.RandomDelta
    ];
    
    for (const mode of modes) {
        const iv = mode === CipherMode.ECB ? null : randomBytes(8);
        const context = new CryptoContext(des, mode, PaddingMode.PKCS7, iv);
        const encrypted = context.encrypt(plaintext);
        const decrypted = context.decrypt(encrypted);
        const result = new TextDecoder().decode(decrypted);
        console.log(`${CipherMode[mode]}: ${result === 'Testing modes!' ? 'OK' : 'FAIL'}`);
    }
}

async function testAsync() {
    console.log('\n=== Async Test ===');
    const key = randomBytes(24);
    const des = new TripleDESCipher(key);
    const plaintext = new TextEncoder().encode('Async test!');
    const iv = randomBytes(8);
    
    const context = new CryptoContext(des, CipherMode.CTR, PaddingMode.PKCS7, iv);
    const encrypted = await context.encryptAsync(plaintext);
    const decrypted = await context.decryptAsync(encrypted);
    const result = new TextDecoder().decode(decrypted);
    
    console.log('Original:', 'Async test!');
    console.log('Decrypted:', result);
    console.log('Success:', result === 'Async test!');
}

async function main() {
    testDES();
    testTripleDES();
    testDEAL();
    testAllModes();
    await testAsync();
    console.log('\n=== All Tests Complete ===');
}

main().catch(console.error);
