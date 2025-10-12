import { YMApi, WrappedYMApi } from "../src";
import config from "./config";

const api = new YMApi();
const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await api.init(config.user);
    await wrappedApi.init(config.user);

    const urls = [
      "https://music.yandex.ru/album/11246103/track/68070362?utm_source=desktop&utm_medium=copy_link",
      "https://music.yandex.ru/track/68070362?utm_source=web&utm_medium=copy_link"
    ];

    const ids = [68070362, 68070362];

    const [wrappedOld, wrappedNew] = await Promise.all(
      urls.map((url) => wrappedApi.getTrack(url))
    );
    const [apiOld, apiNew] = await Promise.all(
      ids.map((id) => api.getTrack(id))
    );

    // Проверка наличия артистов
    const ok =
      wrappedOld.artists?.length &&
      wrappedNew.artists?.length &&
      apiOld[0].artists?.length &&
      apiNew[0].artists?.length;

    if (ok) {
      console.log("✔ Tracks fetched successfully");
      console.log({
        wrappedOld: wrappedOld.artists[0].name,
        wrappedNew: wrappedNew.artists[0].name,
        apiOld: apiOld[0].artists[0].name,
        apiNew: apiNew[0].artists[0].name
      });
      process.exit(0);
    } else {
      throw new Error("Missing artist info in one of the tracks");
    }
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exit(1);
  }
})();
