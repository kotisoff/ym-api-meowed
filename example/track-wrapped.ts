import WrappedYMApi from "../src/WrappedYMApi";
import config from "./config";
const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await wrappedApi.init(config.user);

    const playlist = await wrappedApi.getPlaylist(
      "https://music.yandex.ru/users/music.partners/playlists/1769"
    );
    // OR
    // const playlist = await wrappedApi.getPlaylist(
    //   1769,
    //   "music.partners"
    // );
    if (!playlist.tracks) {
      throw new Error("missing tracks");
    }
    const tracks = await Promise.all(
      playlist.tracks.map(async (track) => ({
        id: track.track.id,
        title: `${track.track.title} - ${track.track.artists
          .map((artist) => artist.name)
          .join(", ")}`,
        downloadUrl: await wrappedApi.getMp3DownloadUrl(track.id)
      }))
    );
    console.log(tracks);
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
