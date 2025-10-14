import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  HttpClientInterface,
  Method,
  Response,
  RequestInterface,
} from "../Types/request";
import { XMLParser } from 'fast-xml-parser';
import { promisify } from 'util';
import * as zlib from "zlib";

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

export default class HttpClient implements HttpClientInterface {
  private defaultTimeout = 10000; // 10 сек
  private retryCount = 2;

  constructor(options?: { timeout?: number; retryCount?: number }) {
    if (options?.timeout) this.defaultTimeout = options.timeout;
    if (options?.retryCount) this.retryCount = options.retryCount;
  }

  private async _sendRequestAxios(
    method: Method,
    request: RequestInterface,
    attempt = 0
  ): Promise<Response> {
    const axiosRequest: AxiosRequestConfig = {
      method,
      url: request.getURL(),
      headers: {
        ...request.getHeaders(),
        "Content-Type": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": "YandexMusicDesktopAppWindows/5.13.2",
        "X-Yandex-Music-Client": "YandexMusicDesktopAppWindows/5.13.2"
      },
      timeout: this.defaultTimeout,
      responseType: "arraybuffer", // для поддержки сжатых ответов
      data: ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
        ? this.serializeBody(request)
        : undefined,
      decompress: true, // авто-распаковка gzip/deflate
    };

    try {
      const response: AxiosResponse = await axios(axiosRequest);
      const data = this.parseResponse(response);
      return data;
    } catch (err) {
      const error = err as any;

      if (
        attempt < this.retryCount &&
        (error.code === "ECONNABORTED" || (error.response?.status ?? 0) >= 500)
      ) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); // простая задержка
        return this._sendRequestAxios(method, request, attempt + 1);
      }

      throw new Error(
        `HTTP ${error.response?.status || "??"} - ${
          error.response?.statusText || error.message
        }`
      );
    }
  }

  private serializeBody(request: RequestInterface): any {
    try {
      const body = request.getBodyData
        ? request.getBodyData()
        : request.getBodyDataString
        ? JSON.parse(request.getBodyDataString())
        : {};
      return body;
    } catch {
      return request.getBodyDataString?.() ?? {};
    }
  }

  private async parseResponse(response: AxiosResponse) {
    const contentEncoding = response.headers["content-encoding"];
    let buf = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);

    // Распаковка, если сжатие
    if (contentEncoding) {
      switch (contentEncoding.toLowerCase()) {
        case "gzip": buf = await promisify(zlib.gunzip)(buf); break;
        case "deflate": buf = await promisify(zlib.inflate)(buf); break;
        case "br": buf = await promisify(zlib.brotliDecompress)(buf); break;
      }
    }

    const text = buf.toString("utf-8");
    const contentType = response.headers["content-type"] ?? "";

    if (contentType.includes("application/json")) {
      return JSON.parse(text)?.result ?? JSON.parse(text);
    }

    if (contentType.includes("xml") || text.startsWith("<")) {
      return new XMLParser({ ignoreAttributes: false }).parse(text);
    }

    return text;
  }


  get(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("get", request);
  }

  post(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("post", request);
  }
}
