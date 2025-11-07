import { RijndaelCipher } from '../../aes-rijndael/RijndaelCipher';
import { GaloisFieldService } from '../../galois/GaloisFieldService';
import { CryptoContext } from '../CryptoContext';
import { CipherMode, PaddingMode } from '../constants';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes, randomBytes } from '../../utils/ModesUtils';

describe('', () => {
    const testText = "Hello, World! This is a test message for AES encryption demo.";
    const testKey128 = randomBytes(16);
    const testKey192 = randomBytes(24); 
    const testKey256 = randomBytes(32);
    const testIV = randomBytes(16);

    const gfModules = [
        { name: 'AES (0x11B)', gf: new GaloisFieldService(0x11B) },
        { name: '0x11D', gf: new GaloisFieldService(0x11D) },
        { name: '0x12B', gf: new GaloisFieldService(0x12B) },
        { name: '0x13F', gf: new GaloisFieldService(0x13F) }
    ];

    describe('1. Шифрование текстовых данных с различными параметрами', () => {
        gfModules.forEach(({ name, gf }) => {
            describe(`Модуль GF(2^8): ${name}`, () => {
                
                describe('AES-128', () => {
                    test('ECB режим с PKCS7 padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.ECB, PaddingMode.PKCS7);
                        
                        cipher.expandKey(testKey128, 4);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });

                    test('CBC режим с ANSI_X923 padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.CBC, PaddingMode.ANSI_X923, testIV);
                        
                        cipher.expandKey(testKey128, 4);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });

                    test('CTR режим без padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.NONE, testIV);
                        
                        cipher.expandKey(testKey128, 4);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });
                });

                describe('AES-192', () => {
                    test('PCBC режим с ISO_10126 padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.PCBC, PaddingMode.ISO_10126, testIV);
                        
                        cipher.expandKey(testKey192, 6);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });

                    test('CFB режим с Zeros padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.CFB, PaddingMode.Zeros, testIV);
                        
                        cipher.expandKey(testKey192, 6);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        const decryptedText = decrypted.replace(/\0+$/, '');
                        expect(decryptedText).toBe(testText);
                    });
                });

                describe('AES-256', () => {
                    test('OFB режим с PKCS7 padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.OFB, PaddingMode.PKCS7, testIV);
                        
                        cipher.expandKey(testKey256, 8);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });

                    test('RandomDelta режим с ANSI_X923 padding', () => {
                        const cipher = new RijndaelCipher({ nb: 4, gf });
                        const context = new CryptoContext(cipher, CipherMode.RandomDelta, PaddingMode.ANSI_X923, testIV);
                        
                        cipher.expandKey(testKey256, 8);
                        const encrypted = context.encrypt(stringToBytes(testText));
                        const decrypted = bytesToString(context.decrypt(encrypted));
                        
                        expect(decrypted).toBe(testText);
                    });
                });
            });
        });
    });

    describe('2. Шифрование файлов разных типов', () => {
        const gf = new GaloisFieldService(0x11B);

        describe('Текстовые файлы', () => {
            test('Текстовый документ с CBC режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CBC, PaddingMode.PKCS7, testIV);
                
                cipher.expandKey(testKey256, 8);
                
                const textFileContent = "Это пример текстового файла.\nСодержит несколько строк.\nИ специальные символы: !@#$%^&*()";
                const encrypted = context.encrypt(stringToBytes(textFileContent));
                const decrypted = bytesToString(context.decrypt(encrypted));
                
                expect(decrypted).toBe(textFileContent);
            });

            test('JSON файл с CFB режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CFB, PaddingMode.ANSI_X923, testIV);
                
                cipher.expandKey(testKey192, 6);
                
                const jsonData = JSON.stringify({
                    name: "test",
                    value: 123,
                    items: ["a", "b", "c"],
                    config: { enabled: true, timeout: 5000 }
                });
                const encrypted = context.encrypt(stringToBytes(jsonData));
                const decrypted = bytesToString(context.decrypt(encrypted));
                
                expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
            });
        });

        describe('Изображения', () => {
            test('Маленькое изображение (PNG-like) с CTR режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.NONE, testIV);
                
                cipher.expandKey(testKey128, 4);
                
                const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); 
                const imageData = randomBytes(300); 
                const fileData = new Uint8Array(pngHeader.length + imageData.length);
                fileData.set(pngHeader);
                fileData.set(imageData, pngHeader.length);
                
                const encrypted = context.encrypt(fileData);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(fileData);
            });

            test('Изображение среднего размера с OFB режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.OFB, PaddingMode.NONE, testIV);
                
                cipher.expandKey(testKey256, 8);
                
                const imageData = randomBytes(30000);
                const encrypted = context.encrypt(imageData);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(imageData);
            });
        });

        describe('Аудио файлы', () => {
            test('WAV-like аудио с PCBC режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.PCBC, PaddingMode.PKCS7, testIV);
                
                cipher.expandKey(testKey192, 6);
                
                const wavHeader = new Uint8Array([
                    0x52, 0x49, 0x46, 0x46, 
                    0x00, 0x00, 0x00, 0x00, 
                    0x57, 0x41, 0x56, 0x45  
                ]);
                const audioData = randomBytes(8000); 
                const fileData = new Uint8Array(wavHeader.length + audioData.length);
                fileData.set(wavHeader);
                fileData.set(audioData, wavHeader.length);
                
                const encrypted = context.encrypt(fileData);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(fileData);
            });

            test('MP3-like данные с CTR режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.NONE, testIV);
                
                cipher.expandKey(testKey256, 8);
                
                const mp3Data = randomBytes(8192); 
                const encrypted = context.encrypt(mp3Data);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(mp3Data);
            });
        });

        describe('Видео файлы', () => {
            test('MP4-like видео фрагмент с CBC режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CBC, PaddingMode.PKCS7, testIV);
                
                cipher.expandKey(testKey256, 8);
                
                const mp4Header = new Uint8Array([
                    0x00, 0x00, 0x00, 0x18, 
                    0x66, 0x74, 0x79, 0x70  
                ]);
                const videoData = randomBytes(50000);
                const fileData = new Uint8Array(mp4Header.length + videoData.length);
                fileData.set(mp4Header);
                fileData.set(videoData, mp4Header.length);
                
                const encrypted = context.encrypt(fileData);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(fileData);
            });

            test('AVI-like контейнер с CFB режимом', () => {
                const cipher = new RijndaelCipher({ nb: 4, gf });
                const context = new CryptoContext(cipher, CipherMode.CFB, PaddingMode.Zeros, testIV);
                
                cipher.expandKey(testKey192, 6);
                
                const aviData = randomBytes(65536); 
                const encrypted = context.encrypt(aviData);
                const decrypted = context.decrypt(encrypted);
                
                const originalLength = aviData.length;
                const decryptedTrimmed = decrypted.slice(0, originalLength);
                expect(decryptedTrimmed).toEqual(aviData);
            });
        });
    });

    describe('3. Различные размеры блоков Rijndael', () => {
        const gf = new GaloisFieldService(0x11B);
        
        test('Блок 192 бит (Nb=6) с CBC режимом', () => {
            const cipher = new RijndaelCipher({ nb: 6, gf });
            const context = new CryptoContext(cipher, CipherMode.CBC, PaddingMode.PKCS7, randomBytes(24));
            
            cipher.expandKey(testKey256, 8);
            const encrypted = context.encrypt(stringToBytes(testText));
            const decrypted = bytesToString(context.decrypt(encrypted));
            
            expect(decrypted).toBe(testText);
        });

        test('Блок 256 бит (Nb=8) с CTR режимом', () => {
            const cipher = new RijndaelCipher({ nb: 8, gf });
            const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.NONE, randomBytes(32));
            
            cipher.expandKey(testKey256, 8);
            const encrypted = context.encrypt(stringToBytes(testText));
            const decrypted = bytesToString(context.decrypt(encrypted));
            
            expect(decrypted).toBe(testText);
        });
    });

    describe('4. Псевдослучайные последовательности', () => {
        const gf = new GaloisFieldService(0x11B);
        
        test('Шифрование случайных данных разных размеров', () => {
            const cipher = new RijndaelCipher({ nb: 4, gf });
            const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.NONE, testIV);
            
            cipher.expandKey(testKey256, 8);
            
            const sizes = [64, 128, 256, 512, 1024];
            for (const size of sizes) {
                const randomData = randomBytes(size);
                const encrypted = context.encrypt(randomData);
                const decrypted = context.decrypt(encrypted);
                
                expect(decrypted).toEqual(randomData);
            }
        });

        test('Шифрование данных с неравномерным распределением', () => {
            const cipher = new RijndaelCipher({ nb: 4, gf });
            const context = new CryptoContext(cipher, CipherMode.OFB, PaddingMode.NONE, testIV);
            
            cipher.expandKey(testKey128, 4);
            
            const patternedData = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                patternedData[i] = (i * 7) % 256; 
            }
            
            const encrypted = context.encrypt(patternedData);
            const decrypted = context.decrypt(encrypted);
            
            expect(decrypted).toEqual(patternedData);
        });
    });
});