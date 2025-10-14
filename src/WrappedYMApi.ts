import {
  type UrlExtractorInterface,
  type TrackId,
  type TrackUrl,
  type DownloadInfo,
  type ApiInitConfig,
  type InitResponse,
  DownloadTrackQuality,
  DownloadTrackCodec,
  type PlaylistId,
  type PlaylistUrl,
  type UserId,
  type UserName,
  type Playlist,
  type Track,
  type AlbumUrl,
  type AlbumId,
  type Album,
  type AlbumWithTracks,
  type ArtistId,
  type ArtistUrl,
  type FilledArtist
} from "./Types";
import YMApi from "./YMApi";
import { UrlExtractor } from "./Network";

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

  async getConcreteDownloadInfoNew(
    track: TrackId | TrackUrl,
    codec: DownloadTrackCodec,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    const info = await this.api.getTrackDownloadInfoNew(
      this.getTrackId(track),
      quality
    );

    const downloadUrl =
      info?.downloadInfo?.url || info?.downloadInfo?.urls?.[0];

    if (!downloadUrl) {
      throw new Error(`Download URL not found in response for track ${track}`);
    }

    const downloadInfo: DownloadInfo = {
      codec,
      bitrateInKbps: info.downloadInfo?.bitrate || 0,
      downloadInfoUrl: downloadUrl,
      direct: true,
      quality: (info.downloadInfo?.quality || quality) as DownloadTrackQuality,
      gain: info.downloadInfo?.gain || false,
      preview: false
    };

    return downloadInfo;
  }

  getMp3DownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfoNew(
      track,
      DownloadTrackCodec.MP3,
      quality
    );
  }

  getMp3DownloadInfoOld(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfo(track, DownloadTrackCodec.MP3, quality);
  }

  getAacDownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfoNew(
      track,
      DownloadTrackCodec.AAC,
      quality
    );
  }

  getFlacDownloadInfo(
    track: TrackId | TrackUrl,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<DownloadInfo> {
    return this.getConcreteDownloadInfoNew(
      track,
      DownloadTrackCodec.FLAC,
      quality
    );
  }

  async getMp3DownloadUrl(
    track: TrackId | TrackUrl,
    short = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<string> {
    return this.api.getTrackDirectLink(
      (await this.getMp3DownloadInfoOld(track, quality)).downloadInfoUrl
    );
  }

  async getMp3DownloadUrlNew(
    track: TrackId | TrackUrl,
    short = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<string> {
    return this.api.getTrackDirectLinkNew(
      (await this.getMp3DownloadInfo(track, quality)).downloadInfoUrl
    );
  }

  async getAacDownloadUrl(
    track: TrackId | TrackUrl,
    short = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<string> {
    return this.api.getTrackDirectLinkNew(
      (await this.getAacDownloadInfo(track, quality)).downloadInfoUrl
    );
  }

  async getFlacDownloadUrl(
    track: TrackId | TrackUrl,
    short = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
  ): Promise<string> {
    return this.api.getTrackDirectLinkNew(
      (await this.getFlacDownloadInfo(track, quality)).downloadInfoUrl
    );
  }

  async getBestDownloadUrl(
    track: TrackId | TrackUrl,
    short = false,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless
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
          return await this.api.getTrackDirectLink(info.downloadInfoUrl, short);
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

  getAlbum(album: AlbumId | AlbumUrl, withTracks = false): Promise<Album> {
    return this.api.getAlbum(this.getAlbumId(album), withTracks);
  }

  getAlbumWithTracks(album: AlbumId | AlbumUrl): Promise<AlbumWithTracks> {
    return this.api.getAlbumWithTracks(this.getAlbumId(album));
  }

  getArtist(artist: ArtistId | ArtistUrl): Promise<FilledArtist> {
    return this.api.getArtist(this.getArtistId(artist));
  }
}