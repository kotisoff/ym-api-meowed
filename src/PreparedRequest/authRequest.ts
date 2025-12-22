import { Request } from "hyperttp";
import config from "./config.js";

export default function authRequest() {
  return new Request(config.authApi);
}
