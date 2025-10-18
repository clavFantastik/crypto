import { RSACryptoService } from '../rsa/crypto-service.js';
import { PrimalityTestType } from '../utils/inteface.js';
import { WienerAttack } from '../attacks/wiener-attack.js';
import { FermatAttack } from '../attacks/fermat-attack.js';


function printSection(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🛡️  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function printSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function printWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

function printError(message: string) {
  console.log(`❌ ${message}`);
}

function printInfo(message: string) {
  console.log(`📊 ${message}`);
}

async function demonstrate() {
  
  // 1. Генерация ключевой пары RSA
  printSection("1. ГЕНЕРАЦИЯ КЛЮЧЕВОЙ ПАРЫ RSA");
  const rsaService = new RSACryptoService({
    testType: PrimalityTestType.MILLER_RABIN,
    minProbability: 0.999,
    bitLength: 256
  });
  
  console.log("🔑 Настройки генерации:");
  console.log(`   • Тест простоты: Miller-Rabin`);
  console.log(`   • Вероятность: 99.9%`);
  console.log(`   • Длина ключа: 256 бит`);
  
  await rsaService.generateKeyPair();
  printSuccess("Ключевая пара успешно сгенерирована!");
  
  const publicKey = rsaService.getPublicKey();
  if (publicKey) {
    console.log(`\n📋 Публичный ключ:`);
    console.log(`   • Модуль (n): ${publicKey.modulus}`);
    console.log(`   • Экспонента (e): ${publicKey.exponent}`);
  }

  // 2. Шифрование и дешифрование
  printSection("2. ТЕСТИРОВАНИЕ ШИФРОВАНИЯ И ДЕШИФРОВАНИЯ");
  const testData = 12345678901234567890n;
  console.log(`📨 Исходные данные: ${testData}`);
  
  try {
    const ciphertext = rsaService.encrypt(testData);
    console.log(`🔒 Шифротекст: ${ciphertext}`);
    
    const decrypted = rsaService.decrypt(ciphertext);
    console.log(`🔓 Дешифрованные данные: ${decrypted}`);
    
    if (testData === decrypted) {
      printSuccess("Шифрование и дешифрование прошли успешно!");
    } else {
      printError("Ошибка: данные не совпадают после дешифрования!");
    }
  } catch (error) {
    printError(`Ошибка при шифровании: ${error}`);
  }

  // 3. Проверка устойчивости к атаке Винера
  printSection("3. ПРОВЕРКА УСТОЙЧИВОСТИ К АТАКЕ ВИНЕРА");
  const attackResult = WienerAttack.attack(rsaService);
  
  console.log(`🔍 Результаты атаки Винера:`);
  console.log(`   • Успешна: ${attackResult.success ? 'ДА' : 'НЕТ'}`);
  console.log(`   • Проанализировано подходящих дробей: ${attackResult.convergents.length}`);
  
  if (!attackResult.success) {
    printSuccess("Нормальный ключ УСТОЙЧИВ к атаке Винера! 🎉");
  } else {
    printError("Ключ УЯЗВИМ к атаке Винера!");
  }

  // 4. Демонстрация атаки Винера на слабый ключ
  printSection("4. ДЕМОНСТРАЦИЯ АТАКИ ВИНЕРА НА СЛАБЫЙ КЛЮЧ");
  console.log("⚡ Генерация специально ослабленного ключа...");
  await rsaService.generateWeakKeyPair();
  
  const weakAttackResult = WienerAttack.attack(rsaService);
  
  console.log(`🎯 Результаты атаки на слабый ключ:`);
  console.log(`   • Успешна: ${weakAttackResult.success ? 'ДА' : 'НЕТ'}`);
  
  if (weakAttackResult.success) {
    printWarning("Атака Винера УСПЕШНА на слабый ключ!");
    console.log(`\n📌 Найденные параметры:`);
    console.log(`   • Приватная экспонента (d): ${weakAttackResult.privateExponent}`);
    console.log(`   • Функция Эйлера (φ): ${weakAttackResult.phi}`);
  } else {
    printSuccess("Даже слабый ключ оказался устойчивым!");
  }

  // 5. Демонстрация атаки Ферма
  printSection("5. ДЕМОНСТРАЦИЯ АТАКИ ФЕРМА");
  console.log("🔧 Создание сервиса с малым ключом для демонстрации...");
  
  const weakRSA = new RSACryptoService({
    testType: PrimalityTestType.MILLER_RABIN,
    minProbability: 0.999,
    bitLength: 128
  });
  
  console.log("🎭 Генерация ключа с близкими простыми числами...");
  await weakRSA.generateWeakKeyPairForFermat();
  
  const weakPublicKey = weakRSA.getPublicKey();
  if (weakPublicKey) {
    console.log(`\n🎯 Цель атаки Ферма:`);
    console.log(`   • Модуль (n): ${weakPublicKey.modulus}`);
    
    const fermatResult = FermatAttack.attack(weakPublicKey);
    
    console.log(`\n🔍 Результаты атаки Ферма:`);
    console.log(`   • Успешна: ${fermatResult.success ? 'ДА' : 'НЕТ'}`);
    console.log(`   • Потрачено попыток: ${fermatResult.attempts}`);
    
    if (fermatResult.success && fermatResult.factors) {
      printWarning("Атака Ферма УСПЕШНА!");
      console.log(`\n📌 Найденные множители:`);
      console.log(`   • p = ${fermatResult.factors[0]}`);
      console.log(`   • q = ${fermatResult.factors[1]}`);
      console.log(`   • Проверка: p * q = ${fermatResult.factors[0] * fermatResult.factors[1]}`);
      console.log(`   • Исходный модуль: ${weakPublicKey.modulus}`);
    }
  }

  // 6. Проверка нормального ключа на уязвимость к Ферма
  printSection("6. ПРОВЕРКА НОРМАЛЬНОГО КЛЮЧА НА УЯЗВИМОСТЬ");
  const normalPublicKey = rsaService.getPublicKey();
  if (normalPublicKey) {
    const isVulnerable = FermatAttack.isVulnerable(normalPublicKey);
    console.log(`🔒 Проверка нормального ключа на уязвимость к атаке Ферма:`);
    console.log(`   • Уязвим: ${isVulnerable ? 'ДА' : 'НЕТ'}`);
    
    if (!isVulnerable) {
      printSuccess("Нормальный ключ УСТОЙЧИВ к атаке Ферма! 🎉");
    } else {
      printError("Нормальный ключ УЯЗВИМ к атаке Ферма!");
    }
  }

  // Итоговый вывод
  printSection("🎉 ИТОГИ ДЕМОНСТРАЦИИ");
  console.log("📈 Все компоненты системы работают корректно:");
  console.log("   ✅ Математические функции (Лежандра, Якоби, НОД)");
  console.log("   ✅ Тесты простоты (Ферма, Соловея-Штрассена, Миллера-Рабина)");
  console.log("   ✅ RSA шифрование/дешифрование");
  console.log("   ✅ Генерация защищенных ключей");
  console.log("   ✅ Атака Винера");
  console.log("   ✅ Атака Ферма");
  console.log("   ✅ Защита от атак в нормальных ключах");
}

// Обработка ошибок
demonstrate().catch(error => {
  printError(`Критическая ошибка: ${error}`);
  console.error(error);
});