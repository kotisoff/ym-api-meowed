import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    // Создание плейлиста
    const playlist = await api.createPlaylist("Test Playlist", {
      visibility: "public"
    });
    if (!playlist.kind || playlist.revision == null)
      throw new Error("Playlist creation failed");

    // Добавление треков
    const tracks = [
      { id: 20599729, albumId: 2347459 },
      { id: 20069589, albumId: 2265364 },
      { id: 15924630, albumId: 1795812 }
    ];
    const updatedPlaylist = await api.addTracksToPlaylist(
      playlist.kind,
      tracks,
      playlist.revision
    );
    if ((updatedPlaylist.trackCount ?? 0) !== tracks.length)
      throw new Error("Tracks were not added");

    // Проверка треков
    const playlists = await api.getPlaylists([playlist.kind], undefined, {
      "rich-tracks": true
    });
    const firstPlaylist = playlists[0];
    if (!firstPlaylist?.tracks?.length)
      throw new Error("Tracks missing after fetch");

    // Очистка
    await api.removeTracksFromPlaylist(
      playlist.kind,
      tracks,
      firstPlaylist.revision!
    );
    await api.removePlaylist(playlist.kind);

    console.log("✔ Playlist smoke test passed");
    process.exitCode = 0;
  } catch (err: any) {
    console.error("❌ Playlist smoke test failed:", err.message ?? err);
    process.exitCode = 1;
  }
})();
