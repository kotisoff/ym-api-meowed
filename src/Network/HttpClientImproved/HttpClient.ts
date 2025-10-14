import { CookieJar } from "tough-cookie";
import { CookieAgent } from "http-cookie-agent/undici";
import { request } from "undici";
import * as zlib from "zlib";
import { promisify } from "util";
import { XMLParser } from "fast-xml-parser";
import * as querystring from "querystring";
import type {
  HttpClientInterface,
  RequestInterface,
  Response
} from "../../Types/request";
import { CacheManager } from "./CacheManager";
import { QueueManager } from "./QueueManager";
import { RateLimiter } from "./RateLimiter";

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryStatusCodes: number[];
  jitter: boolean;
}

export default class HttpClientImproved implements HttpClientInterface {
  private cookieJar = new CookieJar();
  private agent = new CookieAgent({
    cookies: { jar: this.cookieJar },
    connections: 100,
    pipelining: 10
  });

  private cache: CacheManager;
  private queue: QueueManager;
  private limiter: RateLimiter;
  private inflight = new Map<string, Promise<any>>();

  private retryOptions: RetryOptions;
  private defaultHeaders: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "YandexMusicDesktopAppWindows/5.13.2",
    "X-Yandex-Music-Client": "YandexMusicDesktopAppWindows/5.13.2"
  };

  constructor(options?: any) {
    this.cache = new CacheManager(options);
    this.queue = new QueueManager(options?.maxConcurrent ?? 50);
    this.limiter = new RateLimiter(options?.rateLimit);

    this.retryOptions = {
      maxRetries: options?.maxRetries ?? 3,
      baseDelay: 1000,
      maxDelay: 30000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
      jitter: true
    };
  }

  setDefaultHeaders(headers: Record<string, string>) {
    Object.assign(this.defaultHeaders, headers);
  }

  private async decompress(buf: Buffer, enc?: string) {
    if (!enc) return buf.toString("utf-8");
    switch (enc.toLowerCase()) {
      case "gzip":
        return (await gunzip(buf)).toString("utf-8");
      case "deflate":
        return (await inflate(buf)).toString("utf-8");
      case "br":
        return (await brotliDecompress(buf)).toString("utf-8");
      default:
        return buf.toString("utf-8");
    }
  }

  private async sendWithRetry(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string | Buffer
  ) {
    let lastError: any;
    for (let i = 0; i <= this.retryOptions.maxRetries; i++) {
      try {
        await this.limiter.wait();
        const res = await request(url, {
          method,
          headers,
          body,
          dispatcher: this.agent
        });
        const buf = Buffer.from(await res.body.arrayBuffer());
        if (this.retryOptions.retryStatusCodes.includes(res.statusCode)) {
          await this.sleep(this.calcDelay(i));
          continue;
        }
        return { status: res.statusCode, headers: res.headers, body: buf };
      } catch (err) {
        lastError = err;
        if (i < this.retryOptions.maxRetries)
          await this.sleep(this.calcDelay(i));
      }
    }
    throw lastError;
  }

  private calcDelay(attempt: number) {
    const base = Math.min(
      this.retryOptions.baseDelay * 2 ** attempt,
      this.retryOptions.maxDelay
    );
    return this.retryOptions.jitter
      ? base * (0.75 + Math.random() * 0.5)
      : base;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async parseResponse(res: any) {
    const text = await this.decompress(
      res.body,
      res.headers["content-encoding"]
    );
    const type = res.headers["content-type"];
    if (type?.includes("json"))
      return JSON.parse(text).result ?? JSON.parse(text);
    if (type?.includes("xml") || text.startsWith("<"))
      return new XMLParser({ ignoreAttributes: false }).parse(text);
    return text;
  }

  private async request(
    method: string,
    req: RequestInterface,
    useCache = true
  ) {
    const url = req.getURL();
    const rawBody = req.getBodyData();
    const headers = { ...this.defaultHeaders, ...req.getHeaders() };
    const contentType = headers["content-type"] || "";
    const isBodyAllowed = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    let body: string | Buffer | undefined;
    if (isBodyAllowed && rawBody) {
      if (contentType.includes("application/json")) {
        body = JSON.stringify(rawBody);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        body = querystring.stringify(rawBody);
      } else {
        body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
      }
    }

    const key = `${method}:${url}:${body ?? ""}`;

    if (method === "GET" && useCache) {
      const cached = this.cache.get(key);
      if (cached) return cached;
    }

    if (this.inflight.has(key)) return this.inflight.get(key)!;

    const promise = this.queue
      .enqueue(async () => {
        const raw = await this.sendWithRetry(method, url, headers, body);
        const parsed = await this.parseResponse(raw);
        if (method === "GET" && useCache) this.cache.set(key, parsed);
        return parsed;
      })
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);
    return promise;
  }

  get(req: RequestInterface) {
    return this.request("GET", req);
  }
  post(req: RequestInterface) {
    return this.request("POST", req, false);
  }
  put(req: RequestInterface) {
    return this.request("PUT", req, false);
  }
  delete(req: RequestInterface) {
    return this.request("DELETE", req, false);
  }

  clearCache() {
    this.cache.clear();
  }
}
