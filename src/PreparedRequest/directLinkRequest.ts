import Request from "../Network/Request";
import { URL } from "url";

export default function directLinkRequest(url: string) {
  const parsedUrl = new URL(url);
  return new Request({
    scheme: parsedUrl.protocol.replace(":", ""),
    host: parsedUrl.host,
    port: parsedUrl.protocol === "https:" ? 443 : 80,
    path: `${parsedUrl.pathname}${parsedUrl.search}`
  });
}
