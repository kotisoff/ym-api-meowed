import crypto from "crypto";
import { Readable, Transform } from "stream";

/**
 * Ключ для расшифровки потоков Яндекс.Музыки (encraw)
 */
const YANDEX_DECRYPT_KEY = "5869b72821cbd9f76afa0a58f7a94083";

/**
 * Класс для расшифровки зашифрованных потоков Яндекс.Музыки
 */
export class YandexCryptoHelper {
  private key: Buffer;

  constructor(key: string = YANDEX_DECRYPT_KEY) {
    this.key = Buffer.from(key, "hex");
  }

  /**
   * Создает 16-байтовый счетчик для AES-CTR
   */
  private createCounter(value: number): Buffer {
    const counter = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) {
      counter[15 - i] = value & 0xff;
      value >>= 8;
    }
    return counter;
  }

  /**
   * Расшифровывает данные используя AES-128-CTR
   */
  decryptData(ciphertext: Buffer, counter: number = 0): Buffer {
    const iv = this.createCounter(counter);
    const decipher = crypto.createDecipheriv("aes-128-ctr", this.key, iv);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Создает Transform stream для расшифровки данных на лету
   */
  createDecryptStream(counter: number = 0): Transform {
    const iv = this.createCounter(counter);
    const decipher = crypto.createDecipheriv("aes-128-ctr", this.key, iv);

    return new Transform({
      transform(chunk: Buffer, encoding, callback) {
        try {
          const decrypted = decipher.update(chunk);
          callback(null, decrypted);
        } catch (err) {
          callback(err as Error);
        }
      },
      flush(callback) {
        try {
          const final = decipher.final();
          if (final.length > 0) {
            callback(null, final);
          } else {
            callback();
          }
        } catch (err) {
          callback(err as Error);
        }
      }
    });
  }

  /**
   * Расшифровывает файл целиком
   */
  async decryptFile(
    inputPath: string,
    outputPath: string,
    counter: number = 0
  ): Promise<void> {
    const fs = await import("fs/promises");
    const ciphertext = await fs.readFile(inputPath);
    const decrypted = this.decryptData(ciphertext, counter);
    await fs.writeFile(outputPath, decrypted);
  }
}

/**
 * Утилита для работы с зашифрованными URL Яндекс.Музыки
 */
export class YandexEncryptedStreamHandler {
  private crypto: YandexCryptoHelper;

  constructor() {
    this.crypto = new YandexCryptoHelper();
  }

  /**
   * Извлекает параметр `kts` из URL (ключ/счетчик для расшифровки)
   */
  private extractKts(url: string): number {
    const match = url.match(/kts=([a-f0-9]+)/);
    if (!match) return 0;

    // Преобразуем hex в число
    return parseInt(match[1], 16);
  }

  /**
   * Проверяет, является ли URL зашифрованным
   */
  isEncrypted(url: string): boolean {
    return url.includes("/music-v2/crypt/") && url.includes("kts=");
  }

  /**
   * Скачивает и расшифровывает поток
   */
  async fetchAndDecrypt(url: string): Promise<Buffer> {
    const counter = this.extractKts(url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const encryptedData = Buffer.from(await response.arrayBuffer());
    return this.crypto.decryptData(encryptedData, counter);
  }

  /**
   * Создает расшифрованный stream из зашифрованного URL
   */
  async createDecryptedStream(url: string): Promise<Readable> {
    const counter = this.extractKts(url);
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    // Конвертируем ReadableStream в Node.js Readable
    const nodeStream = Readable.fromWeb(response.body as any);
    const decryptStream = this.crypto.createDecryptStream(counter);

    return nodeStream.pipe(decryptStream);
  }
}
