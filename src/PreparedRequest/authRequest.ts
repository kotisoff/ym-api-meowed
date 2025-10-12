import { Request } from "../Network";
import config from "./config";

export default function authRequest() {
  return new Request(config.authApi);
}
