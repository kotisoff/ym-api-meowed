import { YMApi } from "../src";
import config from "./config";

const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const searchResult = await api.search("gorillaz", { type: "artist" });
    const artist = searchResult.artists?.results[0];
    if (!artist?.id) throw new Error("Artist not found");

    let popularTrack = artist.popularTracks?.[0];
    if (!popularTrack) {
      const filledArtist = await api.getArtist(artist.id);
      popularTrack = filledArtist.artist.popularTracks?.[0];
      if (!popularTrack) {
        const artistTracks = await api.getArtistTracks(artist.id);
        popularTrack = artistTracks.tracks?.[0];
      }
    }
    if (!popularTrack) throw new Error("Popular track not found");

    const trackId = popularTrack.id;
    const track = await api.getTrack(trackId);
    const supplement = await api.getTrackSupplement(trackId);
    const downloadInfo = await api.getTrackDownloadInfo(trackId);

    console.log(track);

    const mp3Tracks = downloadInfo
      .filter((r) => r.codec === "mp3")
      .sort((a, b) => b.bitrateInKbps - a.bitrateInKbps);

    const hqTrack = mp3Tracks[0];
    const directLink = hqTrack
      ? await api.getTrackDirectLink(hqTrack.downloadInfoUrl)
      : null;

    // Минималистичный успех
    if (track[0]?.title && artist.name && directLink) {
      console.log("✔ Track fetched successfully:", {
        artist: artist.name,
        track: track[0].title,
        hqMp3: hqTrack?.bitrateInKbps,
        directLink
      });
      process.exit(0);
    } else {
      throw new Error("Incomplete track data");
    }
  } catch (e: any) {
    console.error(`❌ API error: ${e?.message ?? String(e)}`);
    process.exit(1);
  }
})();
