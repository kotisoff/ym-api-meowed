import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);
    const genres = await api.getGenres();
    console.log("Music genres:");

    genres.forEach((genre) => {
      let genreTitle = "Unknown";
      if (genre.titles.en) {
        genreTitle = genre.titles.en.title;
      } else if (genre.titles.ru) {
        genreTitle = genre.titles.ru.title;
      }
      console.log(`${genreTitle}`);

      if (genre.subGenres) {
        genre.subGenres.forEach((subGenre) => {
          let genreTitle = "Unknown";
          if (subGenre.titles.en) {
            genreTitle = subGenre.titles.en.title;
          } else if (subGenre.titles.ru) {
            genreTitle = subGenre.titles.ru.title;
          }
          console.log(`\t>${genreTitle}`);
        });
      }
    });
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
