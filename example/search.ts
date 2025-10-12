import { YMApi, Types } from "../src";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const queries: { q: string; type: Types.SearchType }[] = [
      { q: "gorillaz", type: "artist" },
      { q: "gorillaz", type: "album" },
      { q: "cristmas", type: "track" }
    ];

    for (const { q, type } of queries) {
      const result = await api.search(q, { type });
      if (type === "artist" && result.artists?.results?.length) {
        console.log(
          `✔ Artist search "${q}" returned ${result.artists.results.length}`
        );
      } else if (type === "album" && result.albums?.results?.length) {
        console.log(
          `✔ Album search "${q}" returned ${result.albums.results.length}`
        );
      } else if (type === "track" && result.tracks?.results?.length) {
        console.log(
          `✔ Track search "${q}" returned ${result.tracks.results.length}`
        );
      } else {
        console.error(`❌ Search "${q}" (${type}) returned no results`);
        process.exitCode = 1;
      }
    }
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exitCode = 1;
  }
})();
