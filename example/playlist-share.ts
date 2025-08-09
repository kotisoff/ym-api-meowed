import { YMApi } from "../src";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const playlistUid =
      "https://music.yandex.ru/playlists/ar.dcd89e75-5716-4605-9d69-9f6695979529?utm_source=web&utm_medium=copy_link";

    const playlist = await api.getPlaylist(playlistUid);
    console.log(playlist);
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
