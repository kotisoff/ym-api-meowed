import { YMApi } from "../src";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const searchResult = await api.search("gorillaz", { type: "artist" });
    const artist = searchResult.artists?.results?.[0];

    if (!artist?.id) throw new Error("Artist not found");

    const gorillazResult = await api.getArtistTracks(artist.id, {
      pageSize: 15
    });

    if (!gorillazResult.tracks?.length) {
      console.log("❌ No tracks found");
      process.exit(1);
    }

    console.log("✔ Artist tracks fetched successfully");
    gorillazResult.tracks.forEach((track, i) => {
      console.log(`${i + 1}. ${track.title}`);
    });
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exit(1);
  }
})();
