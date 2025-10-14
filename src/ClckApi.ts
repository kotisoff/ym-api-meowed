import { HttpClientImproved } from "./Network";
import { clckApiRequest } from "./PreparedRequest";
import { HttpClientInterface } from "./Types/request";

const defaultClient: HttpClientInterface = new HttpClientImproved();

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
