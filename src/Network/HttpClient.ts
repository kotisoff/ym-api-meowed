import { CookieJar } from "tough-cookie";
import { CookieAgent } from "http-cookie-agent/undici";
import { request } from "undici";
import { LRUCache } from "lru-cache";
import * as zlib from "zlib";
import { promisify } from "util";
import { XMLParser } from "fast-xml-parser";
import type {
  HttpClientInterface,
  Method,
  Response,
  RequestInterface
} from "../Types/request";

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

export default class HttpClient implements HttpClientInterface {
  private cookieJar: CookieJar;
  private agent: CookieAgent;
  private cache: LRUCache<string, CacheEntry>;
  private cacheTTL: number = 5 * 60 * 1000;
  private retryOptions: RetryOptions;

  constructor(options?: {
    cacheTTL?: number;
    cacheMaxSize?: number;
    maxRetries?: number;
  }) {
    this.cookieJar = new CookieJar();
    this.agent = new CookieAgent({ cookies: { jar: this.cookieJar } });
    this.cache = new LRUCache<string, CacheEntry>({
      max: options?.cacheMaxSize || 100,
      ttl: options?.cacheTTL || this.cacheTTL
    });
    this.retryOptions = {
      maxRetries: options?.maxRetries || 3,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    };
  }

  private async decompressBody(
    buffer: Buffer,
    encoding?: string
  ): Promise<string> {
    if (!encoding) return buffer.toString("utf-8");
    switch (encoding.toLowerCase()) {
      case "gzip":
        return (await gunzip(buffer)).toString("utf-8");
      case "deflate":
        return (await inflate(buffer)).toString("utf-8");
      case "br":
        return (await brotliDecompress(buffer)).toString("utf-8");
      default:
        return buffer.toString("utf-8");
    }
  }

  private getCacheKey(method: Method, url: string, body?: any): string {
    return `${method}:${url}:${body ? JSON.stringify(body) : ""}`;
  }

  private getCachedResponse(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL)
      return cached.data;
    return null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async _sendRequestWithRetry(
    method: Method,
    url: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<{
    statusCode: number;
    headers: Record<string, string | string[]>;
    body: Buffer;
  }> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const response = await request(url, {
          method,
          headers,
          body,
          dispatcher: this.agent,
          bodyTimeout: 10000,
          headersTimeout: 10000
        });
        const bodyBuffer = Buffer.from(await response.body.arrayBuffer());
        if (
          attempt < this.retryOptions.maxRetries &&
          this.retryOptions.retryStatusCodes.includes(response.statusCode)
        ) {
          await this.sleep(this.retryOptions.retryDelay * Math.pow(2, attempt));
          continue;
        }
        return {
          statusCode: response.statusCode,
          headers: response.headers as Record<string, string | string[]>,
          body: bodyBuffer
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryOptions.maxRetries)
          await this.sleep(this.retryOptions.retryDelay * Math.pow(2, attempt));
      }
    }
    throw lastError || new Error("Request failed after all retries");
  }

  private async _sendRequestUndici(
    method: Method,
    requestObj: RequestInterface,
    useCache = true
  ): Promise<Response> {
    const url = requestObj.getURL();
    const bodyData = requestObj.getBodyData();

    if (method.toUpperCase() === "GET" && useCache) {
      const cacheKey = this.getCacheKey(method, url);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) return cached;
    }

    const headers: Record<string, string> = {
      ...requestObj.getHeaders(),
      "Accept-Encoding": "gzip, deflate, br"
    };
    if (!headers["User-Agent"] && !headers["user-agent"])
      headers["User-Agent"] = "YandexMusicDesktopAppWindows/5.23.2";

    const body =
      ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) &&
      bodyData
        ? JSON.stringify(bodyData)
        : undefined;

    const response = await this._sendRequestWithRetry(
      method,
      url,
      headers,
      body
    );
    const encoding = Array.isArray(response.headers["content-encoding"])
      ? response.headers["content-encoding"][0]
      : response.headers["content-encoding"];
    const text = await this.decompressBody(response.body, encoding);

    const contentType = Array.isArray(response.headers["content-type"])
      ? response.headers["content-type"][0]
      : response.headers["content-type"];

    let data: any;
    if (contentType?.includes("json")) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text.slice(0, 200)}...`);
      }
    } else if (contentType?.includes("xml") || text.trim().startsWith("<")) {
      const parser = new XMLParser({ ignoreAttributes: false });
      data = parser.parse(text);
    } else {
      data = text;
    }

    const responseData = data.result ?? data;

    if (method.toUpperCase() === "GET" && useCache) {
      const cacheKey = this.getCacheKey(method, url);
      this.cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    }

    return responseData;
  }

  get(requestObj: RequestInterface, useCache = true): Promise<Response> {
    return this._sendRequestUndici("GET" as Method, requestObj, useCache);
  }

  post(requestObj: RequestInterface): Promise<Response> {
    return this._sendRequestUndici("POST" as Method, requestObj, false);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return { size: this.cache.size, maxSize: this.cache.max };
  }

  getCookies(url: string): Promise<string> {
    return this.cookieJar.getCookieString(url);
  }
}
