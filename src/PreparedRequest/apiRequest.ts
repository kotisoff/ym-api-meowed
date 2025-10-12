import { Request } from "../Network";
import config from "./config";

export default function apiRequest() {
  return new Request(config.api);
}
