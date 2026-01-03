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

  getPlaylist(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): Promise<Playlist> {
    const pl = this.getPlaylistId(playlist, user);
    return this.api.getPlaylist(pl.id, pl.user);
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
