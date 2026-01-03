export type RequestHeaders = { [key: string]: string };
export type RequestQuery = { [key: string]: string };
export type RequestBodyData = { [key: string]: string };
export type RequestConfig = {
  scheme: string;
  host: string;
  port: number;
  path?: string;
  headers?: RequestHeaders;
  query?: RequestQuery;
  bodyData?: RequestBodyData;
};

export type Method = "get" | "post";
export type ObjectResponse = { [key: string]: any };
export type StringResponse = string;
export type Response = ObjectResponse | StringResponse;

export interface RequestInterface {
  setPath(path: string): RequestInterface;
  getHeaders(): RequestHeaders;
  setHeaders(headers: RequestHeaders): RequestInterface;
  addHeaders(headers: RequestHeaders): RequestInterface;
  getQuery(): RequestQuery;
  setQuery(query: RequestQuery): RequestInterface;
  addQuery(query: RequestQuery): RequestInterface;
  getQueryAsString(): string;
  getBodyData(): RequestBodyData;
  getBodyDataString(): string;
  setBodyData(bodyData: RequestBodyData): RequestInterface;
  addBodyData(bodyData: RequestBodyData): RequestInterface;
  getURI(): string;
  getURL(): string;
}

export interface HttpClientInterface {
  get(request: RequestInterface): Promise<Response>;
  post(request: RequestInterface): Promise<Response>;
}
