import { HttpClientImproved, UrlExtractor } from "hyperttp";
import {
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
  type FilledArtist,
  Transport,
  type Codecs
} from "./Types";
import YMApi from "./YMApi";

// ============================================
// Custom Errors
// ============================================

export class YMApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "YMApiError";
  }
}

export class ExtractionError extends YMApiError {
  constructor(
    public readonly entity: string,
    public readonly input: string
  ) {
    super(`Не удалось извлечь ${entity} из: ${input}`, "EXTRACTION_FAILED");
    this.name = "ExtractionError";
  }
}

export class DownloadError extends YMApiError {
  constructor(
    public readonly trackId: TrackId | TrackUrl,
    public readonly codec: DownloadTrackCodec
  ) {
    super(
      `URL не найден для трека ${trackId} с кодеком ${codec}`,
      "DOWNLOAD_URL_NOT_FOUND"
    );
    this.name = "DownloadError";
  }
}

// ============================================
// Configuration
// ============================================

interface CodecConfig {
  readonly codecs: Codecs;
  readonly transport: Transport;
  readonly encrypted: boolean;
}

const CODEC_CONFIG = {
  [DownloadTrackCodec.MP3]: {
    codecs: "mp3",
    transport: "raw",
    encrypted: false
  },
  [DownloadTrackCodec.AAC]: {
    codecs: "aac",
    transport: "encraw",
    encrypted: true
  },
  [DownloadTrackCodec.AACMP4]: {
    codecs: "aac-mp4",
    transport: "encraw",
    encrypted: true
  },
  [DownloadTrackCodec.HEACC]: {
    codecs: "he-aac",
    transport: "encraw",
    encrypted: true
  },
  [DownloadTrackCodec.HEACCMP4]: {
    codecs: "he-aac-mp4",
    transport: "encraw",
    encrypted: true
  },
  [DownloadTrackCodec.FLAC]: {
    codecs: "flac",
    transport: "encraw",
    encrypted: true
  },
  [DownloadTrackCodec.FLACMP4]: {
    codecs: "flac-mp4",
    transport: "encraw",
    encrypted: true
  }
} as const satisfies Record<DownloadTrackCodec, CodecConfig>;

/** Приоритет кодеков: от лучшего качества к худшему */
const CODEC_PRIORITY = [
  DownloadTrackCodec.FLACMP4,
  DownloadTrackCodec.FLAC,
  DownloadTrackCodec.AACMP4,
  DownloadTrackCodec.AAC,
  DownloadTrackCodec.HEACCMP4,
  DownloadTrackCodec.HEACC,
  DownloadTrackCodec.MP3
] as const;

// ============================================
// Types
// ============================================

interface PlaylistIdentifier {
  id: PlaylistId | string;
  user: UserName | null;
}

interface DownloadOptions {
  codec?: DownloadTrackCodec;
  quality?: DownloadTrackQuality;
  forceRaw?: boolean;
}

// ============================================
// Main Class
// ============================================

export default class WrappedYMApi {
  private readonly client: HttpClientImproved;
  private readonly urlExtractor: UrlExtractor;

  constructor(private readonly api: YMApi = new YMApi()) {
    this.client = new HttpClientImproved({ maxRetries: 3, cacheTTL: 300_000 });
    this.urlExtractor = new UrlExtractor();
    this.setupUrlExtractor();
  }

  private setupUrlExtractor(): void {
    this.urlExtractor.registerPlatform("yandex", [
      {
        entity: "track",
        regex: /music\.yandex\.ru\/track\/(?<id>\d+)/,
        groupNames: ["id"]
      },
      {
        entity: "track",
        regex: /music\.yandex\.ru\/album\/(?<album>\d+)\/track\/(?<id>\d+)/,
        groupNames: ["album", "id"]
      },
      {
        entity: "album",
        regex: /music\.yandex\.ru\/album\/(?<id>\d+)/,
        groupNames: ["id"]
      },
      {
        entity: "artist",
        regex: /music\.yandex\.ru\/artist\/(?<id>\d+)/,
        groupNames: ["id"]
      },
      {
        entity: "playlist",
        regex:
          /music\.yandex\.ru\/users\/(?<user>[\w\d\-_.]+)\/playlists\/(?<id>\d+)/,
        groupNames: ["id", "user"]
      },
      {
        entity: "playlist",
        regex: /music\.yandex\.ru\/playlists?\/(?<uid>(?:ar\.)?[A-Za-z0-9-]+)/,
        groupNames: ["uid"]
      }
    ]);
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * @ru Инициализация API клиента с аутентификацией.
   * @en Initialize API client with authentication.
   * @param config Параметры конфигурации API.
   * @returns Промис с данными авторизации.
   */
  init(config: ApiInitConfig): Promise<InitResponse> {
    return this.api.init(config);
  }

  /**
   * @ru Получить экземпляр базового API класса.
   * @en Get instance of the base API class.
   * @returns Экземпляр YMApi.
   */
  getApi(): YMApi {
    return this.api;
  }

  // ============================================
  // ID Extractors (Private)
  // ============================================

  private extractNumericId(input: string, entity: string): number {
    const extracted = this.urlExtractor.extractId(input, entity, "yandex");
    const id = extracted.id;
    if (id === undefined) throw new ExtractionError(entity, input);
    return typeof id === "string" ? parseInt(id, 10) : id;
  }

  private getTrackId(track: TrackUrl | TrackId): TrackId {
    if (typeof track !== "string") return track;
    const extracted = this.urlExtractor.extractId<number>(
      track,
      "track",
      "yandex"
    );
    const id = extracted.id ?? extracted.trackId;
    if (id === undefined) throw new ExtractionError("trackId", track);
    return id;
  }

  private getAlbumId(album: AlbumId | AlbumUrl): AlbumId {
    return typeof album === "string"
      ? this.extractNumericId(album, "album")
      : album;
  }

  private getArtistId(artist: ArtistId | ArtistUrl): ArtistId {
    return typeof artist === "string"
      ? this.extractNumericId(artist, "artist")
      : artist;
  }

  private getPlaylistId(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): PlaylistIdentifier {
    const userStr = user ? String(user) : null;

    if (typeof playlist !== "string") {
      return { id: playlist, user: userStr };
    }

    const extracted = this.urlExtractor.extractId(
      playlist,
      "playlist",
      "yandex"
    );

    if ("uid" in extracted) {
      return { id: extracted.uid, user: null };
    }

    if ("id" in extracted) {
      return {
        id: extracted.id,
        user: extracted.user ? String(extracted.user) : null
      };
    }

    return { id: playlist, user: userStr };
  }

  // ============================================
  // Core Download Methods
  // ============================================

  /**
   * @ru Получить информацию для скачивания трека.
   * @en Get track download information.
   * @param track ID трека или URL.
   * @param options Опции скачивания (кодек, качество, etc.).
   * @returns Промис с информацией о скачивании.
   */
  async getDownloadInfo(
    track: TrackId | TrackUrl,
    options: DownloadOptions = {}
  ): Promise<DownloadInfo> {
    const {
      codec = DownloadTrackCodec.MP3,
      quality = DownloadTrackQuality.Lossless,
      forceRaw = false
    } = options;

    const config = CODEC_CONFIG[codec];
    const transport = forceRaw ? "raw" : config.transport;
    const encrypted = forceRaw ? false : config.encrypted;

    const info = await this.api.getTrackDownloadInfoNew(
      this.getTrackId(track),
      quality,
      config.codecs,
      transport
    );

    const downloadUrl =
      info?.downloadInfo?.url ?? info?.downloadInfo?.urls?.[0];
    if (!downloadUrl) throw new DownloadError(track, codec);

    return {
      codec: codec as any,
      bitrateInKbps: info.downloadInfo?.bitrate ?? 0,
      downloadInfoUrl: downloadUrl,
      direct: true,
      quality: (info.downloadInfo?.quality ?? quality) as DownloadTrackQuality,
      gain: info.downloadInfo?.gain ?? false,
      preview: false,
      encrypted
    };
  }

  /**
   * @ru Получить прямую ссылку для скачивания трека.
   * @en Get direct download URL for track.
   * @param track ID трека или URL.
   * @param options Опции скачивания.
   * @returns Промис с прямой ссылкой на скачивание.
   */
  async getDownloadUrl(
    track: TrackId | TrackUrl,
    options: DownloadOptions = {}
  ): Promise<string> {
    const info = await this.getDownloadInfo(track, options);
    return this.api.getTrackDirectLinkNew(info.downloadInfoUrl);
  }

  // ============================================
  // FFmpeg & Best Quality Methods
  // ============================================

  /**
   * @ru Получить URL для скачивания в FFmpeg-compatible формате (MP3 raw).
   * @en Get FFmpeg-compatible download URL (raw MP3).
   * @param track Track ID or URL to download.
   * @param quality Quality level for download.
   * @returns Promise with download URL or null on error.
   */
  async getDownloadUrlForFFmpeg(
    track: TrackId | TrackUrl,
    quality = DownloadTrackQuality.Lossless
  ): Promise<string | null> {
    try {
      return await this.getDownloadUrl(track, {
        codec: DownloadTrackCodec.MP3,
        quality,
        forceRaw: true
      });
    } catch {
      return null;
    }
  }

  /**
   * @ru Получить лучший доступный URL для скачивания по приоритету кодеков.
   * @en Get best available download URL based on codec priority.
   * @param track Track ID or URL to download.
   * @param quality Quality level for download.
   * @returns Promise with best available download URL or null.
   */
  async getBestDownloadUrl(
    track: TrackId | TrackUrl,
    quality = DownloadTrackQuality.Lossless
  ): Promise<string | null> {
    for (const codec of CODEC_PRIORITY) {
      try {
        return await this.getDownloadUrl(track, { codec, quality });
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * @ru Проверить, является ли URL зашифрованным.
   * @en Check if URL is encrypted.
   * @param url URL to check for encryption.
   * @returns True if URL is encrypted, false otherwise.
   */
  isEncryptedUrl(url: string): boolean {
    return url.includes("/music-v2/crypt/") && url.includes("kts=");
  }

  // ============================================
  // Convenience Methods (Factory-based)
  // ============================================

  private createDownloadInfoGetter(
    codec: DownloadTrackCodec,
    forceRaw = false
  ) {
    return (
      track: TrackId | TrackUrl,
      quality = DownloadTrackQuality.Lossless
    ) => this.getDownloadInfo(track, { codec, quality, forceRaw });
  }

  private createDownloadUrlGetter(codec: DownloadTrackCodec, forceRaw = false) {
    return (
      track: TrackId | TrackUrl,
      quality = DownloadTrackQuality.Lossless
    ) => this.getDownloadUrl(track, { codec, quality, forceRaw });
  }

  /**
   * @ru Получить информацию для скачивания MP3 трека.
   * @en Get MP3 track download information.
   */
  getMp3DownloadInfo = this.createDownloadInfoGetter(
    DownloadTrackCodec.MP3,
    true
  );

  /**
   * @ru Получить информацию для скачивания AAC трека.
   * @en Get AAC track download information.
   */
  getAacDownloadInfo = this.createDownloadInfoGetter(DownloadTrackCodec.AAC);

  /**
   * @ru Получить информацию для скачивания FLAC трека.
   * @en Get FLAC track download information.
   */
  getFlacDownloadInfo = this.createDownloadInfoGetter(DownloadTrackCodec.FLAC);

  /**
   * @ru Получить информацию для скачивания FLAC-MP4 трека.
   * @en Get FLAC-MP4 track download information.
   */
  getFlacMP4DownloadInfo = this.createDownloadInfoGetter(
    DownloadTrackCodec.FLACMP4
  );

  /**
   * @ru Получить URL для скачивания MP3 трека.
   * @en Get MP3 track download URL.
   */
  getMp3DownloadUrl = this.createDownloadUrlGetter(
    DownloadTrackCodec.MP3,
    true
  );

  /**
   * @ru Получить URL для скачивания AAC трека.
   * @en Get AAC track download URL.
   */
  getAacDownloadUrl = this.createDownloadUrlGetter(DownloadTrackCodec.AAC);

  /**
   * @ru Получить URL для скачивания FLAC трека.
   * @en Get FLAC track download URL.
   */
  getFlacDownloadUrl = this.createDownloadUrlGetter(DownloadTrackCodec.FLAC);

  /**
   * @ru Получить URL для скачивания FLAC-MP4 трека.
   * @en Get FLAC-MP4 track download URL.
   */
  getFlacMP4DownloadUrl = this.createDownloadUrlGetter(
    DownloadTrackCodec.FLACMP4
  );

  // ============================================
  // Entity Getters
  // ============================================

  /**
   * @ru Получить плейлист по ID или URL.
   * @en Get playlist by ID or URL.
   * @param playlist Playlist ID or URL.
   * @param user Optional user identifier for playlist ownership.
   * @returns Promise with playlist information.
   */
  getPlaylist(
    playlist: PlaylistId | PlaylistUrl,
    user?: UserId | UserName
  ): Promise<Playlist> {
    const { id, user: extractedUser } = this.getPlaylistId(playlist, user);
    return typeof id === "number"
      ? this.api.getPlaylist(id, extractedUser)
      : this.api.getPlaylist(id);
  }

  /**
   * @ru Получить трек по ID или URL.
   * @en Get track by ID or URL.
   * @param track Track ID or URL.
   * @returns Promise with track information.
   */
  getTrack(track: TrackId | TrackUrl): Promise<Track> {
    return this.api.getSingleTrack(this.getTrackId(track));
  }

  /**
   * @ru Получить альбом по ID или URL.
   * @en Get album by ID or URL.
   * @param album Album ID or URL.
   * @param withTracks Whether to include tracks in response.
   * @returns Promise with album information.
   */
  getAlbum(
    album: AlbumId | AlbumUrl,
    withTracks = false
  ): Promise<Album | AlbumWithTracks> {
    return this.api.getAlbum(this.getAlbumId(album), withTracks);
  }

  /**
   * @ru Получить альбом с треками по ID или URL.
   * @en Get album with tracks by ID or URL.
   * @param album Album ID or URL.
   * @returns Promise with album including tracks.
   */
  getAlbumWithTracks(album: AlbumId | AlbumUrl): Promise<AlbumWithTracks> {
    return this.api.getAlbumWithTracks(this.getAlbumId(album));
  }

  /**
   * @ru Получить исполнителя по ID или URL.
   * @en Get artist by ID or URL.
   * @param artist Artist ID or URL.
   * @returns Promise with artist information.
   */
  getArtist(artist: ArtistId | ArtistUrl): Promise<FilledArtist> {
    return this.api.getArtist(this.getArtistId(artist));
  }
}
