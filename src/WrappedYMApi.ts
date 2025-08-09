import {
  UrlExtractorInterface,
  TrackId,
  TrackUrl,
  DownloadInfo,
  ApiInitConfig,
  InitResponse,
  DownloadTrackQuality,
  DownloadTrackCodec,
  PlaylistId,
  PlaylistUrl,
  UserId,
  UserName,
  Playlist,
  Track,
  AlbumUrl,
  AlbumId,
  Album,
  AlbumWithTracks,
  ArtistId,
  ArtistUrl,
  FilledArtist
} from "./Types";
import YMApi from "./YMApi";
import UrlExtractor from "./Network/UrlExtractor";
import { fetch as undiciFetch } from "undici";

export default class WrappedYMApi {
  constructor(
    private api: YMApi = new YMApi(),
    private urlExtractor: UrlExtractorInterface = new UrlExtractor()
  ) {}

  init(config: ApiInitConfig): Promise<InitResponse> {
    return this.api.init(config);
  }

  getApi(): YMApi {
    return this.api;
  }

  private getTrackId(track: TrackUrl | TrackId): TrackId {
    if (typeof track === "string") {
      return this.urlExtractor.extractTrackId(track);
    } else {
      return track;
    }
  }

  private getAlbumId(album: AlbumId | AlbumUrl): AlbumId {
    if (typeof album === "string") {
      return this.urlExtractor.extractAlbumId(album);
    } else {
      return album;
    }
  }

  private getArtistId(artist: ArtistId | ArtistUrl): ArtistId {
    if (typeof artist === "string") {
      return this.urlExtractor.extractArtistId(artist);
    } else {
      return artist;
    }
  }

  private getPlaylistId(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): { id: PlaylistId; user: UserName } {
    if (typeof playlist === "string") {
      return this.urlExtractor.extractPlaylistId(playlist);
    } else {
      return { id: playlist, user: String(user) };
    }
  }

  /**
   * Resolve share/alias playlist URLs like
   * https://music.yandex.ru/playlists/ar.<uuid>
   * into canonical https://music.yandex.ru/users/<user>/playlists/<kind>
   * If resolution is blocked by SmartCaptcha, throws an explanatory error.
   */
  private async resolvePlaylistUrl(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): Promise<{ id: PlaylistId; user: UserName }> {
    if (typeof playlist !== "string") {
      return { id: playlist, user: String(user) };
    }

    // Try canonical extractor first
    try {
      return this.urlExtractor.extractPlaylistId(playlist);
    } catch (_) {
      /* fallthrough */
    }

    // If looks like share alias, try to follow redirects to canonical
    const isShareAlias = /https?:\/\/music\.yandex\.ru\/playlists\//.test(
      playlist
    );
    if (!isShareAlias) {
      throw new Error("Unsupported playlist URL format");
    }

    const response = await undiciFetch(playlist, { redirect: "follow" });
    const finalUrl = response.url;
    // Attempt to extract from final URL
    try {
      return this.urlExtractor.extractPlaylistId(finalUrl);
    } catch (err) {
      throw new Error(
        "Unable to resolve playlist share URL to canonical. The web page may be protected by SmartCaptcha; please open the link in a browser and copy the canonical users/<user>/playlists/<kind> URL."
      );
    }
  }

  async getConcreteDownloadInfo(
    track: TrackId | TrackUrl,
    codec: DownloadTrackCodec,
    quality: DownloadTrackQuality
  ): Promise<DownloadInfo> {
    const infos = await this.api.getTrackDownloadInfo(this.getTrackId(track));

    return infos
      .filter((i) => i.codec === codec)
      .sort((a, b) =>
        quality === "high"
          ? a.bitrateInKbps - b.bitrateInKbps
          : b.bitrateInKbps - a.bitrateInKbps
      )
      .pop() as DownloadInfo;
  }

  getMp3DownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.High
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfo(track, DownloadTrackCodec.MP3, quality);
  }

  async getMp3DownloadUrl(
    track: TrackId | TrackUrl,
    short: Boolean = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.High
  ): Promise<string> {
    return this.api.getTrackDirectLink(
      (await this.getMp3DownloadInfo(track, quality)).downloadInfoUrl,
      short
    );
  }

  async getPlaylist(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): Promise<Playlist> {
    const pl = await this.resolvePlaylistUrl(playlist, user);
    return this.api.getPlaylist(pl.id, pl.user);
  }

  /**
   * Accepts multiple playlist URLs or ids. If URLs are for different users,
   * groups requests per user and concatenates results.
   */
  async getPlaylistsFromUrls(
    playlists: Array<PlaylistId | PlaylistUrl>,
    user?: UserId | UserName,
    options: { mixed?: boolean; "rich-tracks"?: boolean } = {}
  ): Promise<Array<Playlist>> {
    const resolved = await Promise.all(
      playlists.map((p) => this.resolvePlaylistUrl(p, user))
    );
    const byUser = new Map<string, number[]>();
    for (const { id, user } of resolved) {
      const key = String(user);
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(Number(id));
    }

    const results: Playlist[] = [];
    for (const [groupUser, kinds] of byUser.entries()) {
      const part = await this.api.getPlaylists(kinds, groupUser, options);
      results.push(...part);
    }
    return results;
  }

  getTrack(track: TrackId | TrackUrl): Promise<Track> {
    return this.api.getSingleTrack(this.getTrackId(track));
  }

  getAlbum(
    album: AlbumId | AlbumUrl,
    withTracks: boolean = false
  ): Promise<Album> {
    return this.api.getAlbum(this.getAlbumId(album), withTracks);
  }

  getAlbumWithTracks(album: AlbumId | AlbumUrl): Promise<AlbumWithTracks> {
    return this.api.getAlbumWithTracks(this.getAlbumId(album));
  }

  getArtist(artist: ArtistId | ArtistUrl): Promise<FilledArtist> {
    return this.api.getArtist(this.getArtistId(artist));
  }
}
