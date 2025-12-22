import { HttpClientImproved, HttpClientInterface } from "hyperttp";
import { clckApiRequest } from "./PreparedRequest/index.js";

const defaultClient = new HttpClientImproved();

/**
 * GET: clck.ru/--
 * @param URL Url to shorten
 * @param client Optional custom HTTP client
 * @returns Promise<string> - shortened link
 */
export default function shortenLink(
  URL: string,
  client: HttpClientInterface = defaultClient
): Promise<string> {
  const request = clckApiRequest().setPath("/--").addQuery({ url: URL });
  return client.get(request) as Promise<string>;
}
