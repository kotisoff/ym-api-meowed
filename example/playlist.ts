import { YMApi } from "../src";
import config from "./config";
const api = new YMApi();

(async () => {
  try {
    await api.init(config.user);

    const name = "Test Playlist";
    const options: { visibility: "public" | "private" } = {
      visibility: "public"
    };
    const playlist = await api.createPlaylist(name, options);
    console.log("New playlist has been created:");
    console.log(`Name: ${playlist.title}`);
    console.log(`Kind: ${playlist.kind}`);
    console.log(`Visibility: ${playlist.visibility}`);

    const tracks = [
      { id: 20599729, albumId: 2347459 },
      { id: 20069589, albumId: 2265364 },
      { id: 15924630, albumId: 1795812 }
    ];
    const playlistWithTracks = await api.addTracksToPlaylist(
      playlist.kind,
      tracks,
      playlist.revision
    );
    console.log(
      `\nAdded ${playlistWithTracks.trackCount} tracks to the playlist`
    );

    const getPlaylistsOptions = { "rich-tracks": true };
    const playlists = await api.getPlaylists(
      [playlistWithTracks.kind],
      null,
      getPlaylistsOptions
    );
    const firstPlaylist = playlists.shift();
    if (!firstPlaylist) {
      throw new Error("Something went wrong, first playlist is empty");
    }
    firstPlaylist.tracks?.forEach((item) => {
      console.log(`${item.track.title} - ${item.track.artists[0].name}`);
    });

    await api.removeTracksFromPlaylist(
      playlist.kind,
      tracks,
      firstPlaylist.revision
    );
    console.log("\nAll added tracks removed from the playlist.");

    await api.removePlaylist(playlist.kind);
    console.log("The playlist has been deleted.");
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
