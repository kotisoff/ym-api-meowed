import { fetch as undiciFetch } from "undici";
import {
  HttpClientInterface,
  Method,
  Response,
  RequestInterface
} from "../Types/request";

export default class HttpClient implements HttpClientInterface {
  async _sendRequest(
    method: Method,
    request: RequestInterface
  ): Promise<Response> {
    const url = request.getURL();
    const headers: Record<string, string> = { ...request.getHeaders() };

    let body: string | undefined = undefined;
    if (method.toUpperCase() === "POST") {
      body = request.getBodyDataString();
      const hasContentTypeHeader = Object.keys(headers).some(
        (h) => h.toLowerCase() === "content-type"
      );
      if (!hasContentTypeHeader) {
        headers["content-type"] = "application/x-www-form-urlencoded";
      }
    }

    const response = await undiciFetch(url, {
      method: method.toUpperCase(),
      headers,
      body
    });

    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}: ${responseText}`
      );
    }

    // Try to parse JSON when possible; fall back to text
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(responseText);
        return json && typeof json === "object" && "result" in json
          ? json.result
          : json;
      } catch (_) {
        return responseText;
      }
    } else {
      // Some endpoints might return JSON without proper content-type
      try {
        const maybeJson = JSON.parse(responseText);
        return maybeJson &&
          typeof maybeJson === "object" &&
          "result" in maybeJson
          ? maybeJson.result
          : maybeJson;
      } catch (_) {
        return responseText;
      }
    }
  }

  get(request: RequestInterface): Promise<Response> {
    return this._sendRequest("get", request);
  }

  post(request: RequestInterface): Promise<Response> {
    return this._sendRequest("post", request);
  }
}
