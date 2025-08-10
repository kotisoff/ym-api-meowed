import { WrappedYMApi, YMApi } from "../src";
import config from "./config";

const WrappedApi = new WrappedYMApi();
const api = new YMApi();
(async () => {
  try {
    await WrappedApi.init(config.user);
    await api.init(config.user);
    
    const playlistUidWrapped =
      "https://music.yandex.ru/playlists/ar.dcd89e75-5716-4605-9d69-9f6695979529?utm_source=web&utm_medium=copy_link";
    const playlistUid =
      "ar.dcd89e75-5716-4605-9d69-9f6695979529";

    const playlistOlddtWrapped = "https://music.yandex.ru/users/yamusic-bestsongs/playlists/3246342?utm_source=desktop&utm_medium=copy_link";
    const playlistOlddt = { user: "yamusic-bestsongs", id: 3246342 };

    const playlistWrappedDirect = await WrappedApi.getPlaylist(playlistUidWrapped);
    const playlistOldWrappedDirect = await WrappedApi.getPlaylist(playlistOlddtWrapped);

    const playlistApi = await api.getPlaylist(playlistUid);
    const playlistOldApi = await api.getPlaylist(playlistOlddt.id, playlistOlddt.user);
    
    console.log("WrappedAPI");
    console.log(playlistOldWrappedDirect.tracks?.length);
    console.log(playlistWrappedDirect.tracks?.length);
    console.log("YMApi");
    console.log(playlistOldApi.tracks?.length);
    console.log(playlistApi.tracks?.length);
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
