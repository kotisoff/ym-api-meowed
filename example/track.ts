import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);
    const searchResult = await api.search("gorillaz", { type: "artist" });
    const gorillaz = searchResult.artists?.results[0];
    const gorillazMostPopularTrack = gorillaz?.popularTracks[0];
    const gorillazMostPopularTrackId = gorillazMostPopularTrack?.id as number;
    console.log({ searchResult, gorillaz, gorillazMostPopularTrack });

    const getTrackResult = await api.getTrack(gorillazMostPopularTrackId);
    console.log({ getTrackResult });

    const getTrackSupplementResult = await api.getTrackSupplement(
      gorillazMostPopularTrackId
    );
    console.log({ getTrackSupplementResult });

    const getTrackDownloadInfoResult = await api.getTrackDownloadInfo(
      gorillazMostPopularTrackId
    );
    console.log({ getTrackDownloadInfoResult });

    const mp3Tracks = getTrackDownloadInfoResult
      .filter((r) => r.codec === "mp3")
      .sort((a, b) => b.bitrateInKbps - a.bitrateInKbps);
    const hqMp3Track = mp3Tracks[0];
    console.log({ mp3Tracks, hqMp3Track });

    const getTrackDirectLinkResult = await api.getTrackDirectLink(
      hqMp3Track.downloadInfoUrl
    );
    console.log({ getTrackDirectLinkResult });
  } catch (e) {
    console.log(`api error: ${e.message}`);
  }
})();
