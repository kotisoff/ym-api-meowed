import { Request } from "hyperttp";
import config from "./config.js";

export default function apiRequest() {
  return new Request(config.clckApi);
}
