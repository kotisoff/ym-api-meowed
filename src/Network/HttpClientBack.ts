import axios, { AxiosRequestConfig } from "axios";
import {
  HttpClientInterface,
  Method,
  Response,
  RequestInterface
} from "../Types/request";

import * as querystring from "querystring";

export default class HttpClient implements HttpClientInterface {
  async _sendRequestAxios(
    method: Method,
    request: RequestInterface
  ): Promise<Response> {
    const isBodyAllowed = ["PUT", "POST", "DELETE", "PATCH"].includes(
      method.toUpperCase()
    );
    const body = isBodyAllowed ? this.serializeBody(request) : undefined;

    const headers: Record<string, string> = { ...request.getHeaders() };
    if (isBodyAllowed && !headers["content-type"]) {
      headers["content-type"] = "application/json";
      if (body && typeof body === "string") {
        headers["content-type"] = "application/x-www-form-urlencoded";
      }
    }

    const axiosRequest: AxiosRequestConfig = {
      method,
      url: request.getURL(),
      headers,
      data: body
    };

    const { data } = await axios(axiosRequest);
    return data.result ?? data;
  }

  private serializeBody(request: RequestInterface): any {
    const body = request.getBodyData?.() ?? {};
    const contentType = request.getHeaders()?.["content-type"] ?? "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      return querystring.stringify(body);
    }

    return body;
  }

  get(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("get", request);
  }

  post(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("post", request);
  }
}
