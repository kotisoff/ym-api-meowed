import { YMApi } from "../src";
import { GetFeedResponse } from "../src/Types";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const feed = (await api.getFeed()) as GetFeedResponse;

    if (
      (!feed.generatedPlaylists || feed.generatedPlaylists.length === 0) &&
      (!feed.days || feed.days.length === 0)
    ) {
      console.error("❌ Feed is empty");
      process.exitCode = 1;
      return;
    }

    console.log("✔ Feed fetched successfully");

    console.log({
      playlists: feed.generatedPlaylists
        ?.slice(0, 3)
        .map((p) => p.data.title ?? "Unknown"),
      daysCount: feed.days?.length ?? 0
    });
  } catch (e: any) {
    console.error("❌ API error:", e?.message ?? e);
    process.exitCode = 1;
  }
})();
