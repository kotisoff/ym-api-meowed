import WrappedYMApi from "../src/WrappedYMApi";
import config from "./config";

const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await wrappedApi.init(config.user);

    const playlist = await wrappedApi.getPlaylist(
      "https://music.yandex.ru/users/music.partners/playlists/1769"
    );

    if (!playlist.tracks?.length) {
      console.error("❌ Playlist has no tracks");
      process.exit(1);
    }

    const tracks = await Promise.all(
      playlist.tracks.map(async ({ track, id }) => ({
        id: track.id,
        title: `${track.title} - ${track.artists.map((a) => a.name).join(", ")}`,
        downloadUrl: await wrappedApi.getMp3DownloadUrl(id)
      }))
    );

    console.log("✔ Tracks fetched successfully");
    console.log(tracks.slice(0, 5)); // Для минималистичного вывода показываем только первые 5
    process.exit(0);
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exit(1);
  }
})();
