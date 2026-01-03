import { Types, WrappedYMApi, YMApi } from "../src";

const WrappedApi = new WrappedYMApi();
const api = new YMApi();

const access_token = process.env.YM_ACCESS_TOKEN as string;
const uid = Number(process.env.YM_UID);

function hexStringToUint8Array(hexString: string): Uint8Array<ArrayBuffer> {
  if (!hexString || hexString.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const hexPairs = hexString.match(/.{1,2}/g);
  if (!hexPairs) {
    throw new Error("Invalid hex string");
  }

  const byteValues = hexPairs.map((pair) => {
    const value = parseInt(pair, 16);
    if (Number.isNaN(value)) {
      throw new Error("Invalid hex string");
    }
    return value;
  });

  const arr = new Uint8Array(byteValues.length) as Uint8Array<ArrayBuffer>;
  arr.set(byteValues);
  return arr;
}

/**
 * Преобразует число в 16-байтовый counter для AES-CTR (big-endian).
 */
function numberToUint8Counter(num: number): Uint8Array<ArrayBuffer> {
  let value = BigInt(num);
  const counter = new Uint8Array(16) as Uint8Array<ArrayBuffer>;

  for (let i = 0; i < 16; i++) {
    counter[15 - i] = Number(value & 0xffn);
    value >>= 8n;
  }

  return counter;
}

/**
 * Расшифровка данных AES-CTR через WebCrypto.
 */
async function decryptData(params: {
  key: string;
  data: ArrayBuffer;
  loadedBytes?: number;
}): Promise<ArrayBuffer> {
  const { key, data, loadedBytes } = params;

  const keyBytes = hexStringToUint8Array(key);

  // WebCrypto: типы TS ломаются, поэтому просто приводим к any/BufferSource
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as any,
    { name: "AES-CTR" },
    false,
    ["encrypt", "decrypt"]
  );

  let counter: Uint8Array<ArrayBuffer> = new Uint8Array(
    16
  ) as Uint8Array<ArrayBuffer>;

  if (loadedBytes !== undefined) {
    const blockNumber = Math.floor(loadedBytes / 16);
    counter = numberToUint8Counter(blockNumber);
  }

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter: counter as any,
      length: 128
    },
    cryptoKey,
    data as any
  );

  return decryptedData;
}

(async () => {
  try {
    if (!access_token || !uid) {
      throw new Error("YM_ACCESS_TOKEN and YM_UID must be set");
    }

    await WrappedApi.init({ access_token, uid });
    await api.init({ access_token, uid });

    const trackId = 118947620;

    const track = await api.getTrackDownloadInfoNew(
      trackId,
      Types.DownloadTrackQuality.Lossless,
      "flac,aac,he-aac,mp3,flac-mp4,aac-mp4,he-aac-mp4",
      "encraw"
    );

    const info = track.downloadInfo;

    if (!info || !info.url) {
      console.error("❌ Track URL not found");
      process.exitCode = 1;
      return;
    }

    console.log("✔ Track URL fetched successfully");
    console.log(`Track ID: ${info.trackId}`);
    console.log(`Codec: ${info.codec}`);
    console.log(`Quality: ${info.quality}`);
    console.log(`Bitrate: ${info.bitrate} kbps`);
    console.log(`Gain applied: ${info.gain}`);
    console.log(`Transport: ${info.transport}`);
    console.log(`Size: ${info.size} bytes`);
    console.log(`Main URL: ${info.url}`);

    if (info.urls?.length) {
      console.log("\nAlternative URLs:");
      info.urls.forEach((alt: string, idx: number) =>
        console.log(` [${idx + 1}] ${alt}`)
      );
    }

    // Пример места, где потом можно вызывать decryptData:
    const encryptedBytes = await fetch(info.url).then((r) => r.arrayBuffer());
    const keyHex = "5869b72821cbd9f76afa0a58f7a94083"; // сюда реальный ключ
    const decrypted = await decryptData({
      key: keyHex,
      data: encryptedBytes,
      loadedBytes: 0
    });

    console.log(decrypted);

    process.exitCode = 0;
  } catch (err: any) {
    console.error("❌ API error:", err?.message ?? err);
    process.exitCode = 1;
  }
})();
