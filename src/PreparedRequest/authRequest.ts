import { Request } from "hyperttp";
import config from "./config";

export default function authRequest() {
  return new Request(config.authApi);
}
