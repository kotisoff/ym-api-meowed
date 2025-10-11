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
  ): { id: PlaylistId | string; user: UserName | null } {
    if (typeof playlist === "string") {
      return this.urlExtractor.extractPlaylistId(playlist);
    } else {
      return { id: playlist, user: user ? String(user) : null };
    }
  }

  async getConcreteDownloadInfo(
    track: TrackId | TrackUrl,
    codec: DownloadTrackCodec,
    quality: DownloadTrackQuality
  ): Promise<DownloadInfo> {
    const info = await this.api.getTrackDownloadInfoNew(track as string, quality);

    // новая структура: downloadInfo.url или downloadInfo.urls[0]
    const downloadUrl = info.downloadInfo?.url || info.downloadInfo?.urls?.[0];
    if (!downloadUrl) {
      throw new Error("Download info not found");
    }

    const downloadInfo: DownloadInfo = {
      codec,
      bitrateInKbps: info.downloadInfo.bitrate || 0,
      downloadInfoUrl: downloadUrl,
      direct: true,
      quality: info.downloadInfo.quality as DownloadTrackQuality,
      gain: info.downloadInfo.gain || false,
      preview: false
    };

    return downloadInfo;
  }


  getMp3DownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfo(track, DownloadTrackCodec.MP3, quality);
  }

  getAacDownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfo(track, DownloadTrackCodec.AAC, quality);
  }

  getFlacDownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfo(
      track,
      DownloadTrackCodec.FLAC,
      quality
    );
  }

  async getMp3DownloadUrl(
    track: TrackId | TrackUrl,
    short: Boolean = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.High,
  ): Promise<string> {
    return this.api.getTrackDirectLinkNew(
      (await this.getMp3DownloadInfo(track, quality)).downloadInfoUrl,
    );
  }

  async getAacDownloadUrl(
    track: TrackId | TrackUrl,
    short: Boolean = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.High,
  ): Promise<string> {
    return this.api.getTrackDirectLink(
      (await this.getAacDownloadInfo(track, quality)).downloadInfoUrl,
      short
    );
  }

  async getFlacDownloadUrl(
    track: TrackId | TrackUrl,
    short: Boolean = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.High,
  ): Promise<string> {
    return this.api.getTrackDirectLink(
      (await this.getFlacDownloadInfo(track, quality)).downloadInfoUrl,
      short
    );
  }

  async getBestDownloadUrl(
    track: TrackId | TrackUrl,
    short: boolean = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.High
  ): Promise<string | null> {
    const codecsPriority: DownloadTrackCodec[] = [
      DownloadTrackCodec.FLAC,
      DownloadTrackCodec.AAC,
      DownloadTrackCodec.MP3
    ];

    for (const codec of codecsPriority) {
      try {
        let info: DownloadInfo | null = null;

        switch (codec) {
          case DownloadTrackCodec.FLAC:
            info = await this.getFlacDownloadInfo(track, quality);
            break;
          case DownloadTrackCodec.AAC:
            info = await this.getAacDownloadInfo(track, quality);
            break;
          case DownloadTrackCodec.MP3:
            info = await this.getMp3DownloadInfo(track, quality);
            break;
        }

        if (info?.downloadInfoUrl) {
          // Передаём codec из приоритета, а не info.codec
          return await this.api.getTrackDirectLink(
            info.downloadInfoUrl,
            short
          );
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  getPlaylist(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): Promise<Playlist> {
    const pl = this.getPlaylistId(playlist, user);
    if (typeof pl.id === "number") {
      return this.api.getPlaylist(pl.id, pl.user);
    }
    return this.api.getPlaylist(pl.id);
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
