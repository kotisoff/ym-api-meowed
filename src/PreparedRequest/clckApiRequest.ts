import Request from "../Network/Request";
import config from "./config";

export default function apiRequest() {
  return new Request(config.clckApi);
}
