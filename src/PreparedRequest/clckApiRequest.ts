import { Request } from "hyperttp";
import config from "./config";

export default function apiRequest() {
  return new Request(config.clckApi);
}
