import { YMApi, WrappedYMApi } from "../src";
import config from "./config";

const api = new YMApi();
const WrappedApi = new WrappedYMApi();

(async () => {
  try {
    await api.init(config.user);
    await WrappedApi.init(config.user);

    const trackUrl = "https://music.yandex.ru/album/11246103/track/68070362?utm_source=desktop&utm_medium=copy_link";
    const trackUrlNew = "https://music.yandex.ru/track/68070362?utm_source=web&utm_medium=copy_link"

    const trackId = 68070362;
    const trackIdNew = 68070362;

    const trackWrapped = await WrappedApi.getTrack(trackUrl);
    const trackWrappedNew = await WrappedApi.getTrack(trackUrlNew);
    const track = await api.getTrack(trackId);
    const trackNew = await api.getTrack(trackIdNew);
    console.log("WrappedAPI");
    console.log(trackWrapped.artists[0].name);
    console.log(trackWrappedNew.artists[0].name);
    console.log("YMApi");
    console.log(track[0].artists[0].name);
    console.log(trackNew[0].artists[0].name);
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();