import WrappedYMApi from "../src/WrappedYMApi";
import config from "./config";

const wrappedApi = new WrappedYMApi();

(async () => {
  try {
    await wrappedApi.init(config.user);

    const album = await wrappedApi.getApi().getAlbumWithTracks(3421932);

    // Проверка, что ответ валидный
    if (
      !album ||
      !album.title ||
      !album.volumes ||
      album.volumes.length === 0
    ) {
      throw new Error("Invalid album response");
    }

    console.log(`${album.title}\n`);
    album.volumes.forEach((volume, vi) => {
      if (!Array.isArray(volume))
        throw new Error(`Volume ${vi} is not an array`);
      volume.forEach((track, i) => {
        if (!track.title) throw new Error(`Track ${i + 1} is missing title`);
        console.log(`${i + 1}. ${track.title}`);
      });
    });

    // Если дошли сюда — тест пройден
    process.exitCode = 0;
  } catch (e: any) {
    console.error(`api error: ${e?.message ?? String(e)}`);
    process.exitCode = 1; // Тест считается проваленным
  }
})();
