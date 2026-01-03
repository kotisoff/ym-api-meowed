import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    const token = await api.init(config.user);
    console.log(`uid: ${token.uid}`);
    console.log(`token: ${token.access_token}`);

    const status = await api.getAccountStatus();
    console.log(`logged in as ${status.account.login}`);
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
