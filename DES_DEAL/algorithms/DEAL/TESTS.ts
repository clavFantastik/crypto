import { DEALCipher } from './DEALCipher.js';
import { CryptoContext } from '../../CryptoContext.js';
import { CipherMode, PaddingMode } from '../../constants/constants.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class DEALDemo {
    private keys = {
        'DEAL-128': new Uint8Array(16).fill(1),
        'DEAL-192': new Uint8Array(24).fill(2), 
        'DEAL-256': new Uint8Array(32).fill(3)
    };
    private iv = new Uint8Array(16).fill(4);

    constructor() {
        if (!existsSync('deal_demo_results')) mkdirSync('deal_demo_results');
    }

    async runAllDemos() {
        console.log('🚀 DEAL ДЕМОНСТРАЦИЯ\n');

        await this.demoAsyncPerformance();
        await this.demoKeySizes();
        await this.demoRandomData();
        await this.demoTextFiles();
        await this.demoImageFiles();
        await this.demoAllModes();

        console.log('\n🎉 Демонстрация завершена!');
    }

    private async demoAsyncPerformance() {
        console.log('\n⚡ 1. Проверка DEAL');
        console.log('='.repeat(50));

        const testData = new Uint8Array(1024 * 50); 
        for (let i = 0; i < testData.length; i++) {
            testData[i] = i % 256; 
        }

        const key = this.keys['DEAL-128'];
        const modes = [CipherMode.ECB, CipherMode.CTR, CipherMode.CBC];

        console.log(`📏 Данные: ${this.formatBytes(testData.length)}`);

        for (const mode of modes) {
            await this.testDealAsync(key, testData, mode);
        }
    }

    private async demoKeySizes() {
        console.log('\n🔑 2. СРАВНЕНИЕ РАЗМЕРОВ КЛЮЧЕЙ');
        console.log('='.repeat(50));

        const testData = new Uint8Array(1024); 
        for (let i = 0; i < testData.length; i++) {
            testData[i] = i % 256;
        }

        console.log('\n📊 Размер ключа | Sync(мс) | Async(мс) | Ускорение');
        console.log('─'.repeat(50));

        const keyTypes = Object.keys(this.keys) as Array<keyof typeof this.keys>;
        
        for (const keyType of keyTypes) {
            const key = this.keys[keyType];
            const syncStart = performance.now();
            const cipher = new DEALCipher(key);
            const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.PKCS7, this.iv);
            const encrypted = context.encrypt(testData);
            const decrypted = context.decrypt(encrypted);
            const syncTime = performance.now() - syncStart;

            const asyncStart = performance.now();
            const cipherAsync = new DEALCipher(key);
            const contextAsync = new CryptoContext(cipherAsync, CipherMode.CTR, PaddingMode.PKCS7, this.iv);
            const encryptedAsync = await contextAsync.encryptAsync(testData);
            const decryptedAsync = await contextAsync.decryptAsync(encryptedAsync);
            const asyncTime = performance.now() - asyncStart;

            const speedup = (syncTime / asyncTime).toFixed(1);
            const correct = this.arraysEqual(testData, decrypted) && 
                          this.arraysEqual(testData, decryptedAsync);

            console.log(` ${keyType.padEnd(12)} | ${syncTime.toFixed(1).padEnd(8)} | ${asyncTime.toFixed(1).padEnd(9)} | ${speedup}x ${correct ? '✅' : '❌'}`);
        }
    }

    private async demoRandomData() {
        console.log('\n📊 3. СЛУЧАЙНЫЕ ДАННЫЕ');
        console.log('='.repeat(40));

        const sizes = [64, 256, 1024];
        const key = this.keys['DEAL-128'];

        for (const size of sizes) {
            console.log(`\n📏 ${this.formatBytes(size)}:`);
            
            const randomData = new Uint8Array(size);
            for (let i = 0; i < size; i++) randomData[i] = i % 256;

            const cipher = new DEALCipher(key);
            const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.PKCS7, this.iv);
            
            const encrypted = await context.encryptAsync(randomData);
            const decrypted = await context.decryptAsync(encrypted);
            
            const success = this.arraysEqual(randomData, decrypted);
            console.log(`   Результат: ${success ? '✅' : '❌'} | Режим: CTR`);
        }
    }

    private async demoTextFiles() {
        console.log('\n📝 4. ТЕКСТОВЫЕ ФАЙЛЫ');
        console.log('='.repeat(40));

        const texts = [
            { name: 'short', content: 'Hello, DEAL!' },
            { name: 'medium', content: 'Привет, DEAL!' }
        ];

        const key = this.keys['DEAL-192'];

        for (const text of texts) {
            console.log(`\n📄 ${text.name} (${text.content.length} chars)`);
            
            const textData = new TextEncoder().encode(text.content);
            const cipher = new DEALCipher(key);
            const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.PKCS7, this.iv);
            
            const startTime = performance.now();
            const encrypted = await context.encryptAsync(textData);
            const decrypted = await context.decryptAsync(encrypted);
            const time = performance.now() - startTime;
            
            const decryptedText = new TextDecoder().decode(decrypted);
            
            console.log(`   Время: ${time.toFixed(1)}мс | Совпадение: ${text.content === decryptedText ? '✅' : '❌'}`);

            this.saveFile(`text_${text.name}_encrypted.bin`, encrypted);
        }
    }

    private async demoImageFiles() {
        console.log('\n🖼️  5. ИЗОБРАЖЕНИЯ');
        console.log('='.repeat(40));

        const image = { name: 'small', width: 32, height: 32 };
        const key = this.keys['DEAL-256'];

        console.log(`\n🖼️  ${image.name} (${image.width}x${image.height})`);
        
        const bmpData = this.createFastBMP(image.width, image.height);
        const cipher = new DEALCipher(key);
        const context = new CryptoContext(cipher, CipherMode.CTR, PaddingMode.PKCS7, this.iv);
        
        const startTime = performance.now();
        const encrypted = await context.encryptAsync(bmpData);
        const decrypted = await context.decryptAsync(encrypted);
        const time = performance.now() - startTime;

        console.log(`   Размер: ${this.formatBytes(bmpData.length)} | Время: ${time.toFixed(1)}мс`);
        console.log(`   Корректность: ${this.arraysEqual(bmpData, decrypted) ? '✅' : '❌'}`);

        this.saveFile(`image_${image.name}_encrypted.bin`, encrypted);
    }

    private async demoAllModes() {
        console.log('\n🎛️  6. РЕЖИМЫ ШИФРОВАНИЯ');
        console.log('='.repeat(40));

        const testData = new TextEncoder().encode("Тест DEAL");
        const key = this.keys['DEAL-192'];

        const modes = [CipherMode.ECB, CipherMode.CTR, CipherMode.CBC];

        console.log('\n📊 Режим | Sync(мс) | Async(мс) | Ускорение');
        console.log('─'.repeat(45));

        for (const mode of modes) {
            try {
                const syncStart = performance.now();
                const cipher = new DEALCipher(key);
                const context = new CryptoContext(
                    cipher, 
                    mode, 
                    PaddingMode.PKCS7, 
                    mode === CipherMode.ECB ? null : this.iv
                );
                const encrypted = context.encrypt(testData);
                const decrypted = context.decrypt(encrypted);
                const syncTime = performance.now() - syncStart;

                const asyncStart = performance.now();
                const cipherAsync = new DEALCipher(key);
                const contextAsync = new CryptoContext(
                    cipherAsync, 
                    mode, 
                    PaddingMode.PKCS7, 
                    mode === CipherMode.ECB ? null : this.iv
                );
                const encryptedAsync = await contextAsync.encryptAsync(testData);
                const decryptedAsync = await contextAsync.decryptAsync(encryptedAsync);
                const asyncTime = performance.now() - asyncStart;

                const speedup = (syncTime / asyncTime).toFixed(1);
                const correct = this.arraysEqual(testData, decrypted) && 
                              this.arraysEqual(testData, decryptedAsync);

                console.log(` ${CipherMode[mode].padEnd(6)} | ${syncTime.toFixed(1).padEnd(8)} | ${asyncTime.toFixed(1).padEnd(9)} | ${speedup}x ${correct ? '✅' : '❌'}`);
            } catch (error: any) {
                console.log(` ${CipherMode[mode].padEnd(6)} | ERROR ${' | '.repeat(2)}❌`);
            }
        }
    }

    private async testDealAsync(key: Uint8Array, data: Uint8Array, mode: CipherMode) {
        const syncStart = performance.now();
        const cipher = new DEALCipher(key);
        const context = new CryptoContext(
            cipher, 
            mode, 
            PaddingMode.PKCS7, 
            mode === CipherMode.ECB ? null : this.iv
        );
        const encrypted = context.encrypt(data);
        const decrypted = context.decrypt(encrypted);
        const syncTime = performance.now() - syncStart;

        const asyncStart = performance.now();
        const cipherAsync = new DEALCipher(key);
        const contextAsync = new CryptoContext(
            cipherAsync, 
            mode, 
            PaddingMode.PKCS7, 
            mode === CipherMode.ECB ? null : this.iv
        );
        const encryptedAsync = await contextAsync.encryptAsync(data);
        const decryptedAsync = await contextAsync.decryptAsync(encryptedAsync);
        const asyncTime = performance.now() - asyncStart;

        const speedup = syncTime / asyncTime;
        const correct = this.arraysEqual(data, decrypted) && 
                      this.arraysEqual(data, decryptedAsync) &&
                      this.arraysEqual(encrypted, encryptedAsync);

        const icon = speedup > 1.1 ? '🚀' : speedup > 1 ? '⚡' : '🐌';
        console.log(`   ${CipherMode[mode].padEnd(6)}: ${syncTime.toFixed(1)}мс → ${asyncTime.toFixed(1)}мс ${icon} ${correct ? '✅' : '❌'}`);
    }

    private createFastBMP(width: number, height: number): Uint8Array {
        const headerSize = 54;
        const dataSize = width * height * 3;
        const fileSize = headerSize + dataSize;
        
        const bmp = new Uint8Array(fileSize);
        const view = new DataView(bmp.buffer);
        
        view.setUint8(0, 0x42); view.setUint8(1, 0x4D);
        view.setUint32(2, fileSize, true);
        view.setUint32(10, headerSize, true);
        view.setUint32(14, 40, true);
        view.setInt32(18, width, true);
        view.setInt32(22, height, true);
        view.setUint16(26, 1, true);
        view.setUint16(28, 24, true);
        view.setUint32(34, dataSize, true);
        
        let offset = headerSize;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                bmp[offset++] = (x * 255 / width);   
                bmp[offset++] = (y * 255 / height);  
                bmp[offset++] = 128;                 
            }
        }
        
        return bmp;
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    private saveFile(filename: string, data: Uint8Array) {
        try {
            writeFileSync(join('deal_demo_results', filename), data);
        } catch {
           
        }
    }

    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}


const demo = new DEALDemo();
demo.runAllDemos().catch(console.error);