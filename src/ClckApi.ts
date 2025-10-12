import { HttpClientImproved } from "./Network";
import { clckApiRequest } from "./PreparedRequest";

const httpClient = new HttpClientImproved();

/**
 * GET: clck.ru/--
 * @param URL Url to something
 * @returns clck.ru shortened link
 */
export default function shortenLink(URL: string): Promise<string> {
  const request = clckApiRequest().setPath("/--").addQuery({ url: URL });
  return httpClient.get(request) as Promise<string>;
}
