import WrappedYMApi from "../src/WrappedYMApi";
import config from "./config";
const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await wrappedApi.init(config.user);

    const album = await wrappedApi.getApi().getAlbumWithTracks(3421932);
    console.log(`${album.title}\n`);
    album.volumes.forEach((volume) =>
      volume.forEach((track, i) => console.log(`${i + 1}. ${track.title}`))
    );
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
