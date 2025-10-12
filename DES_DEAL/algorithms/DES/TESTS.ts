import { DESCipher } from './DESCipher.js';
import { DESKeyExpansion } from './DESKeyExpansion.js';
import { CryptoContext } from '../../CryptoContext.js';
import { CipherMode, PaddingMode } from '../../constants/constants.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class DESDemo {
    private key = new Uint8Array([0x13, 0x34, 0x57, 0x79, 0x9B, 0xBC, 0xDF, 0xF1]);
    private iv = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF]);

    constructor() {
        if (!existsSync('demo_results')) mkdirSync('demo_results');
    }

    async runAllDemos() {
        console.log('🚀 ДЕМОНСТРАЦИЯ DES АЛГОРИТМА\n');

        await this.demoAsyncPerformance();
        await this.demoParallelism();
        await this.demoRandomData();
        await this.demoTextFiles();
        await this.demoImageFiles();
        await this.demoAllModesComparison();

        console.log('\n🎉 Демонстрация завершена!');
    }

    private async demoAsyncPerformance() {
        console.log('\n⚡ 1. Проверка DES');
        console.log('='.repeat(50));

        const testSizes = [
            { name: 'small', size: 512 },      
            { name: 'medium', size: 1024 * 10 }, 
            { name: 'large', size: 1024 * 100 }  
        ];

    
        const testModes = [CipherMode.ECB, CipherMode.CTR, CipherMode.CBC];

        for (const testSize of testSizes) {
            console.log(`\n📊 ${testSize.name.toUpperCase()}: ${this.formatBytes(testSize.size)}`);
            
           
            const testData = new Uint8Array(testSize.size);
            for (let i = 0; i < testSize.size; i++) {
                testData[i] = i % 256; 
            }

            for (const mode of testModes) {
                await this.quickAsyncTest(testData, mode);
            }
        }
    }

    
    private async demoParallelism() {
        console.log('\n🔬 2. БЫСТРЫЙ АНАЛИЗ ПАРАЛЛЕЛИЗМА');
        console.log('='.repeat(50));

        
        const testData = new Uint8Array(1024 * 100);
        for (let i = 0; i < testData.length; i++) {
            testData[i] = i % 256; 
        }

        console.log(`📏 Тестовые данные: ${this.formatBytes(testData.length)}`);

        const modes = [
            { mode: CipherMode.ECB, name: 'ECB' },
            { mode: CipherMode.CTR, name: 'CTR' },
            { mode: CipherMode.CBC, name: 'CBC' }
        ];

       
        const promises = modes.map(({ mode, name }) => 
            this.quickParallelTest(testData, mode, name)
        );

        const results = await Promise.all(promises);
        
        console.log('\n📈 РЕЗУЛЬТАТЫ:');
        console.log('─'.repeat(45));
        for (const result of results) {
            console.log(` ${result.name.padEnd(6)} | ${result.syncTime.toFixed(1)}мс → ${result.asyncTime.toFixed(1)}мс | ${result.speedup}x | ${result.correctness ? '✅' : '❌'}`);
        }
    }

   
    private async demoRandomData() {
        console.log('\n📊 3. СЛУЧАЙНЫЕ ДАННЫЕ');
        console.log('='.repeat(50));

      
        const sizes = [64, 256, 1024];
        const modes = [CipherMode.ECB, CipherMode.CTR]; 

        for (const size of sizes) {
            console.log(`\n📏 ${this.formatBytes(size)}:`);
            
            const randomData = new Uint8Array(size);
            for (let i = 0; i < size; i++) randomData[i] = i % 256;

           
            const promises = modes.map(mode => 
                this.quickCheckMode(randomData, mode)
            );

            const results = await Promise.all(promises);
            
            for (const result of results) {
                console.log(`   ${result.mode.padEnd(6)} | ${result.status}`);
            }
        }
    }

   
    private async demoTextFiles() {
        console.log('\n📝 4. ТЕКСТОВЫЕ ФАЙЛЫ');
        console.log('='.repeat(50));

        const texts = [
            { name: 'short', content: 'Hello, DES!' },
            { name: 'medium', content: 'Тест DES.' },
        ];

        for (const text of texts) {
            console.log(`\n📄 ${text.name} (${text.content.length} chars)`);
            
            const textData = new TextEncoder().encode(text.content);
            
            const {encrypted, decrypted, time} = await this.quickProcessData(textData, CipherMode.CTR);
            const decryptedText = new TextDecoder().decode(decrypted);
            
            console.log(`   Время: ${time.toFixed(1)}мс | Совпадение: ${text.content === decryptedText ? '✅' : '❌'}`);

            this.saveFile(`text_${text.name}_encrypted.bin`, encrypted);
        }
    }

    private async demoImageFiles() {
        console.log('\n🖼️  5. ИЗОБРАЖЕНИЯ');
        console.log('='.repeat(50));

        const images = [
            { name: 'bmp_32x32', width: 32, height: 32 },
        ];

        for (const img of images) {
            console.log(`\n🖼️  ${img.name}`);
            
            const bmpData = this.createFastBMP(img.width, img.height);
            const {encrypted, decrypted, time} = await this.quickProcessData(bmpData, CipherMode.CTR);

            console.log(`   Размер: ${this.formatBytes(bmpData.length)} | Время: ${time.toFixed(1)}мс`);
            console.log(`   Корректность: ${this.arraysEqual(bmpData, decrypted) ? '✅' : '❌'}`);

            this.saveFile(`image_${img.name}_encrypted.bin`, encrypted);
        }
    }

    private async demoAllModesComparison() {
        console.log('\n📈 6. СРАВНЕНИЕ РЕЖИМОВ');
        console.log('='.repeat(50));

        const testData = new TextEncoder().encode("Тест DES. ".repeat(10));
        const modes = [CipherMode.ECB, CipherMode.CBC, CipherMode.CTR, CipherMode.CFB]; 

        console.log('\n📊 Режим | Sync(мс) | Async(мс) | Ускорение');
        console.log('─'.repeat(45));

        const promises = modes.map(mode => 
            this.quickModeComparison(testData, mode)
        );

        const results = await Promise.all(promises);
        
        for (const result of results) {
            const speedup = result.syncTime / result.asyncTime;
            const speedupStr = speedup > 1.1 ? `🚀${speedup.toFixed(1)}x` : `${speedup.toFixed(1)}x`;
            console.log(` ${result.mode.padEnd(6)} | ${result.syncTime.toFixed(1).padEnd(8)} | ${result.asyncTime.toFixed(1).padEnd(9)} | ${speedupStr}`);
        }
    }

    private async quickAsyncTest(data: Uint8Array, mode: CipherMode) {
        const syncStart = performance.now();
        const syncResult = this.processDataSync(data, mode);
        const syncTime = performance.now() - syncStart;

        const asyncStart = performance.now();
        const asyncResult = await this.processDataAsync(data, mode);
        const asyncTime = performance.now() - asyncStart;

        const speedup = syncTime / asyncTime;
        const icon = speedup > 1.1 ? '🚀' : speedup > 1 ? '⚡' : '🐌';
        
        console.log(`   ${CipherMode[mode].padEnd(6)}: ${syncTime.toFixed(1)}мс → ${asyncTime.toFixed(1)}мс ${icon}`);
    }

    private async quickParallelTest(data: Uint8Array, mode: CipherMode, name: string) {
        const syncStart = performance.now();
        const syncResult = this.processDataSync(data, mode);
        const syncTime = performance.now() - syncStart;

        const asyncStart = performance.now();
        const asyncResult = await this.processDataAsync(data, mode);
        const asyncTime = performance.now() - asyncStart;

        const correctness = this.arraysEqual(syncResult.encrypted, asyncResult.encrypted);

        return {
            name,
            syncTime,
            asyncTime,
            speedup: (syncTime / asyncTime).toFixed(1),
            correctness
        };
    }

    private async quickCheckMode(data: Uint8Array, mode: CipherMode) {
        try {
            const syncResult = this.processDataSync(data, mode);
            const asyncResult = await this.processDataAsync(data, mode);
            
            const correct = this.arraysEqual(data, syncResult.decrypted) && 
                          this.arraysEqual(data, asyncResult.decrypted) &&
                          this.arraysEqual(syncResult.encrypted, asyncResult.encrypted);
            
            return {
                mode: CipherMode[mode],
                status: correct ? '✅' : '❌'
            };
        } catch {
            return {
                mode: CipherMode[mode],
                status: '❌ ERROR'
            };
        }
    }

    private async quickProcessData(data: Uint8Array, mode: CipherMode) {
        const start = performance.now();
        const result = await this.processDataAsync(data, mode);
        const time = performance.now() - start;

        return { ...result, time };
    }

    private async quickModeComparison(data: Uint8Array, mode: CipherMode) {
        const syncStart = performance.now();
        const syncResult = this.processDataSync(data, mode);
        const syncTime = performance.now() - syncStart;

        const asyncStart = performance.now();
        const asyncResult = await this.processDataAsync(data, mode);
        const asyncTime = performance.now() - asyncStart;

        return {
            mode: CipherMode[mode],
            syncTime,
            asyncTime
        };
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


    private processDataSync(data: Uint8Array, mode: CipherMode) {
        const cipher = new DESCipher();
        const keyExpansion = new DESKeyExpansion();
        const roundKeys = keyExpansion.generateRoundKeys(this.key);
        cipher.setRoundKeys(roundKeys);

        const context = new CryptoContext(cipher, mode, PaddingMode.PKCS7, this.iv);
        const encrypted = context.encrypt(data);
        const decrypted = context.decrypt(encrypted);

        return { encrypted, decrypted };
    }

    private async processDataAsync(data: Uint8Array, mode: CipherMode) {
        const cipher = new DESCipher();
        const keyExpansion = new DESKeyExpansion();
        const roundKeys = keyExpansion.generateRoundKeys(this.key);
        cipher.setRoundKeys(roundKeys);

        const context = new CryptoContext(cipher, mode, PaddingMode.PKCS7, this.iv);
        const encrypted = await context.encryptAsync(data);
        const decrypted = await context.decryptAsync(encrypted);

        return { encrypted, decrypted };
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    private saveFile(filename: string, data: Uint8Array) {
        try {
            writeFileSync(join('demo_results', filename), data);
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


const demo = new DESDemo();
demo.runAllDemos().catch(console.error);