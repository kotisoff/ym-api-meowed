import { SearchType } from "../src/types";
import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);
    let query = "gorillaz";
    const options: { type: SearchType } = { type: "artist" };
    const artistResult = await api.search(query, options);
    console.log(
      `Search result for artists "${query}" (page: ${artistResult.page}, per page: ${artistResult.perPage})`
    );
    artistResult.artists?.results.forEach((artist) => {
      console.log(artist.name);
    });
    options.type = "album";
    const albumResult = await api.search(query, options);
    console.log(
      `\nSearch result for albums "${query}" (page: ${albumResult.page}, per page: ${albumResult.perPage})`
    );
    albumResult.albums?.results.forEach((album) => {
      console.log(`${album.title} - ${album.artists[0].name}`);
    });
    query = "cristmas";
    options.type = "track";
    const result = await api.search(query, options);
    console.log(
      `\nSearch result for tracks: "${query}" (page: ${result.page}, per page: ${result.perPage})`
    );

    result.tracks?.results.forEach((track) => {
      console.log(track.title + " - " + track.artists[0]?.name);
    });
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
