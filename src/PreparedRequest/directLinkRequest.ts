import { Request } from "hyperttp";
import { URL } from "url";

export default function directLinkRequest(url: string) {
  const parsedUrl = new URL(url);

  const request = new Request({
    scheme: parsedUrl.protocol.replace(":", ""),
    host: parsedUrl.host,
    port: parsedUrl.protocol === "https:" ? 443 : 80,
    path: `${parsedUrl.pathname}${parsedUrl.search}`,
    headers: {},
    query: {},
    bodyData: {}
  });

  return request
}
