import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);
    const feed = await api.getFeed();
    console.log({ s: feed });
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
