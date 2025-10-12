import { YMApi } from "../src";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    const token = await api.init(config.user);

    if (!token || !token.uid || !token.access_token) {
      throw new Error("Failed to obtain access token or UID");
    }

    console.log(`uid: ${token.uid}`);
    console.log(`token: ${token.access_token}`);

    const status = await api.getAccountStatus();
    if (!status?.account?.login) {
      throw new Error("Failed to fetch account status");
    }

    console.log(`logged in as ${status.account.login}`);
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exit(1);
  }
})();
