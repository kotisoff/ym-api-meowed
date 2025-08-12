import axios, { type AxiosRequestConfig } from "axios";
import type {
  HttpClientInterface,
  Method,
  Response,
  RequestInterface
} from "../Types/request";

export default class HttpClient implements HttpClientInterface {
  async _sendRequestAxios(
    method: Method,
    request: RequestInterface
  ): Promise<Response> {
    const axiosRequest: AxiosRequestConfig = {
      method,
      url: request.getURL(),
      headers: request.getHeaders(),
      data: {}
    };

    if (["PUT", "POST", "DELETE", "PATCH"].includes(method.toUpperCase())) {
      axiosRequest.data = request.getBodyDataString();
      axiosRequest.headers = {
        ...axiosRequest.headers,
        ...{ "content-type": "application/x-www-form-urlencoded" }
      };
    }

    const { data } = await axios(axiosRequest);

    if (data.result) {
      return data.result;
    } else {
      return data;
    }
  }

  get(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("get", request);
  }

  post(request: RequestInterface): Promise<Response> {
    return this._sendRequestAxios("post", request);
  }
}
