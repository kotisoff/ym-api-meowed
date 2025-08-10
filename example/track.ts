import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);
    const searchResult = await api.search("gorillaz", { type: "artist" });
    const gorillaz = searchResult.artists?.results[0];
    let gorillazMostPopularTrack = gorillaz?.popularTracks?.[0];

    if (!gorillazMostPopularTrack && gorillaz?.id) {
      // Try filled artist first
      const filled = await api.getArtist(gorillaz.id);
      gorillazMostPopularTrack = filled.artist.popularTracks?.[0];
      // Fallback: fetch artist tracks and take the first one
      if (!gorillazMostPopularTrack) {
        const artistTracks = await api.getArtistTracks(gorillaz.id);
        gorillazMostPopularTrack = artistTracks.tracks?.[0];
      }
    }

    if (!gorillazMostPopularTrack) {
      console.log({ searchResult, gorillaz, gorillazMostPopularTrack });
      throw new Error("Popular track not found for artist");
    }

    const gorillazMostPopularTrackId = gorillazMostPopularTrack.id;
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
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
