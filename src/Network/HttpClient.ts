import { fetch as undiciFetch } from "undici"
import type { HttpClientInterface, Method, Response, RequestInterface } from "../Types/request"

export default class HttpClient implements HttpClientInterface {
  private static readonly USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  ]

  private static readonly ACCEPT_LANGUAGES = [
    "ru-RU,ru;q=0.9,en;q=0.8",
    "en-US,en;q=0.9,ru;q=0.8",
    "ru,en-US;q=0.9,en;q=0.8",
  ]

  private cookieJar: Map<string, string> = new Map()
  private lastRequestTime = 0
  private requestCount = 0

  private getRandomUserAgent(): string {
    return HttpClient.USER_AGENTS[Math.floor(Math.random() * HttpClient.USER_AGENTS.length)]
  }

  private getRandomAcceptLanguage(): string {
    return HttpClient.ACCEPT_LANGUAGES[Math.floor(Math.random() * HttpClient.ACCEPT_LANGUAGES.length)]
  }

  private async addDelay(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    const minDelay = 500
    const maxDelay = 2000
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay

    if (timeSinceLastRequest < randomDelay) {
      await new Promise((resolve) => setTimeout(resolve, randomDelay - timeSinceLastRequest))
    }

    this.lastRequestTime = Date.now()
  }

  private getBrowserHeaders(): Record<string, string> {
    return {
      "User-Agent": this.getRandomUserAgent(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": this.getRandomAcceptLanguage(),
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    }
  }

  private updateCookies(response: globalThis.Response): void {
    const setCookieHeaders = response.headers.get("set-cookie")
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(",")
      cookies.forEach((cookie) => {
        const [nameValue] = cookie.split(";")
        const [name, value] = nameValue.split("=")
        if (name && value) {
          this.cookieJar.set(name.trim(), value.trim())
        }
      })
    }
  }

  private getCookieString(): string {
    const cookies = Array.from(this.cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")
    return cookies
  }

  private async handleCaptchaResponse(response: globalThis.Response, url: string): Promise<globalThis.Response> {
    const responseText = await response.text()

    if (response.status === 403 && responseText.includes("smart-captcha")) {
      console.warn("Captcha detected, implementing bypass strategy...")

      await this.addDelay()

      const retryHeaders: Record<string, string> = {
        ...this.getBrowserHeaders(),
        Referer: "https://music.yandex.ru/",
        Origin: "https://music.yandex.ru",
      }

      const cookieString = this.getCookieString()
      if (cookieString) {
        retryHeaders["Cookie"] = cookieString
      }

      const retryResponse = await undiciFetch(url, {
        method: "GET",
        headers: retryHeaders,
      })

      if (retryResponse.ok) {
        this.updateCookies(retryResponse)
        return retryResponse
      }
    }

    return new globalThis.Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

  async _sendRequest(method: Method, request: RequestInterface): Promise<Response> {
    await this.addDelay()

    const url = request.getURL()
    const requestHeaders = request.getHeaders()

    const headers: Record<string, string> = {
      ...this.getBrowserHeaders(),
      ...requestHeaders,
    }

    const cookieString = this.getCookieString()
    if (cookieString) {
      headers["Cookie"] = cookieString
    }

    if (url.includes("music.yandex.ru") || url.includes("api.music.yandex.net")) {
      headers["Referer"] = "https://music.yandex.ru/"
      headers["Origin"] = "https://music.yandex.ru"
      headers["X-Requested-With"] = "XMLHttpRequest"
    }

    let body: string | undefined = undefined
    if (method.toUpperCase() === "POST") {
      body = request.getBodyDataString()
      const hasContentTypeHeader = Object.keys(headers).some((h) => h.toLowerCase() === "content-type")
      if (!hasContentTypeHeader) {
        headers["content-type"] = "application/x-www-form-urlencoded"
      }
    }

    let response: globalThis.Response

    try {
      response = await undiciFetch(url, {
        method: method.toUpperCase(),
        headers,
        body,
      })

      this.updateCookies(response)

      if (response.status === 403) {
        response = await this.handleCaptchaResponse(response, url)
      }
    } catch (error) {
      console.error("Request failed:", error)
      throw error
    }

    const contentType = response.headers.get("content-type") || ""
    const responseText = await response.text()

    if (!response.ok) {
      if (response.status === 403 && responseText.includes("smart-captcha")) {
        throw new Error(
          `Yandex Captcha detected. Please try again later or use different approach. Status: ${response.status}`,
        )
      }

      throw new Error(`HTTP ${response.status} ${response.statusText}: ${responseText}`)
    }

    this.requestCount++

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(responseText)
        return json && typeof json === "object" && "result" in json ? json.result : json
      } catch (_) {
        return responseText
      }
    } else {
      try {
        const maybeJson = JSON.parse(responseText)
        return maybeJson && typeof maybeJson === "object" && "result" in maybeJson ? maybeJson.result : maybeJson
      } catch (_) {
        return responseText
      }
    }
  }

  get(request: RequestInterface): Promise<Response> {
    return this._sendRequest("get", request)
  }

  post(request: RequestInterface): Promise<Response> {
    return this._sendRequest("post", request)
  }

  clearCookies(): void {
    this.cookieJar.clear()
  }

  getRequestStats(): { requestCount: number; cookieCount: number } {
    return {
      requestCount: this.requestCount,
      cookieCount: this.cookieJar.size,
    }
  }
}
