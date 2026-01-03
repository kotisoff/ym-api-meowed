import { WrappedYMApi, YMApi } from "../src";
import config from "./config";

const WrappedApi = new WrappedYMApi();
const api = new YMApi();

(async () => {
  try {
    await WrappedApi.init(config.user);
    await api.init(config.user);

    const playlistUrls = [
      "https://music.yandex.ru/playlists/ar.dcd89e75-5716-4605-9d69-9f6695979529?utm_source=web&utm_medium=copy_link",
      "https://music.yandex.ru/users/yamusic-bestsongs/playlists/3246342?utm_source=desktop&utm_medium=copy_link"
    ];

    const playlistIds = [
      { id: "ar.dcd89e75-5716-4605-9d69-9f6695979529", user: null },
      { id: 3246342, user: "yamusic-bestsongs" }
    ];

    const wrappedPlaylists = await Promise.all(
      playlistUrls.map((url) => WrappedApi.getPlaylist(url))
    );

    const apiPlaylists = await Promise.all(
      playlistIds.map(({ id, user }) =>
        typeof id === "number"
          ? api.getPlaylist(id, user ?? undefined)
          : api.getPlaylist(id)
      )
    );

    console.log(
      "✔ WrappedAPI playlists track counts:",
      wrappedPlaylists.map((p) => p.tracks?.length ?? 0)
    );
    console.log(
      "✔ YMApi playlists track counts:",
      apiPlaylists.map((p) => p.tracks?.length ?? 0)
    );

    // exit code для CI/tests
    const allOk = [...wrappedPlaylists, ...apiPlaylists].every(
      (p) => (p.tracks?.length ?? 0) > 0
    );
    process.exitCode = allOk ? 0 : 1;
  } catch (err: any) {
    console.error("❌ API error:", err?.message ?? err);
    process.exitCode = 1;
  }
})();
