import { YMApi } from "../src";
import { GetGenresResponse } from "../src/Types";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const genres = (await api.getGenres()) as GetGenresResponse;

    if (!genres || genres.length === 0) {
      console.error("❌ No genres found");
      process.exitCode = 1;
    } else {
      console.log("✔ Genres fetched successfully");
      process.exitCode = 0;

      // Минималистичный вывод: первые 5 жанров
      console.log(
        "Genres:",
        genres
          .slice(0, 5)
          .map((g) => g.title)
          .join(", ")
      );
    }
  } catch (e: any) {
    console.error("❌ API error:", e?.message ?? e);
    process.exitCode = 1;
  }
})();
