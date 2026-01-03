import WrappedYMApi from "../src/WrappedYMApi";
import config from "./config";
const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await wrappedApi.init(config.user);

    const artist = await wrappedApi.getArtist(800020);
    // OR
    // const artist = await wrappedApi.getArtist("https://music.yandex.ru/artist/800020");
    console.log({ artist });
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
