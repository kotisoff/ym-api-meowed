import {
  authRequest,
  apiRequest,
  directLinkRequest
} from "./PreparedRequest/index.js";
import fallbackConfig from "./PreparedRequest/config.js";
import * as crypto from "crypto";
import { withRetry } from "./utils/timeout.js";
import {
  type ApiConfig,
  type ApiInitConfig,
  type InitResponse,
  type GetGenresResponse,
  type Playlist,
  type GetTrackResponse,
  type Language,
  type GetTrackSupplementResponse,
  type GetTrackDownloadInfoResponse,
  type GetFeedResponse,
  type GetAccountStatusResponse,
  type Track,
  type TrackId,
  type ApiUser,
  type SearchOptions,
  type ConcreteSearchOptions,
  type SearchAllResponse,
  type SearchArtistsResponse,
  type SearchTracksResponse,
  type SearchAlbumsResponse,
  type AlbumId,
  type Album,
  type AlbumWithTracks,
  type FilledArtist,
  type Artist,
  type ArtistId,
  type ArtistTracksResponse,
  type DisOrLikedTracksResponse,
  type ChartType,
  type ChartTracksResponse,
  type NewReleasesResponse,
  type NewPlaylistsResponse,
  type PodcastsResponse,
  type SimilarTracksResponse,
  type StationTracksResponse,
  type StationInfoResponse,
  type AllStationsListResponse,
  type RecomendedStationsListResponse,
  type QueuesResponse,
  type QueueResponse,
  type RotorSessionCreateBody,
  type RotorSessionCreateResponse,
  DownloadTrackQuality,
  type FileInfoResponseNew,
  type Codecs,
  type Transport
} from "./Types/index.js";
import shortenLink from "./ClckApi.js";
import {
  HttpClientImproved,
  type RequestInterface,
  type ResponseType
} from "hyperttp";

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

export class AuthError extends YMApiError {
  constructor(message = "Authentication required") {
    super(message, "AUTH_REQUIRED");
    this.name = "AuthError";
  }
}

export class TrackNotFoundError extends YMApiError {
  constructor(public readonly trackId: TrackId) {
    super(`Track not found: ${trackId}`, "TRACK_NOT_FOUND");
    this.name = "TrackNotFoundError";
  }
}

export class DownloadInfoError extends YMApiError {
  constructor(message: string) {
    super(message, "DOWNLOAD_INFO_ERROR");
    this.name = "DownloadInfoError";
  }
}

export class InvalidUrlError extends YMApiError {
  constructor(public readonly url: string) {
    super(`Invalid Yandex Music URL: ${url}`, "INVALID_URL");
    this.name = "InvalidUrlError";
  }
}

// ============================================
// Constants
// ============================================

const SIGNATURE_KEY = "kzqU4XhfCaY6B6JTHODeq5";
const DIRECT_LINK_SALT = "XGRlBW9FXlekgbPrRHuSiA";
const SERVER_OFFSET_CACHE_TTL = 300_000;

const DEFAULT_HTTP_CONFIG = {
  timeout: 10_000,
  maxRetries: 2,
  maxConcurrent: 20,
  cacheTTL: 60_000,
  userAgent: "YandexMusicDesktopAppWindows/5.13.2"
} as const;

// ============================================
// Types
// ============================================

type UserId = number | string | null;

interface ServerOffsetCache {
  value: number;
  timestamp: number;
}

interface ApiResponse<T> {
  invocationInfo: unknown;
  result: T;
}

type SearchType = "all" | "artist" | "track" | "album";
type SearchResponseMap = {
  all: SearchAllResponse;
  artist: SearchArtistsResponse;
  track: SearchTracksResponse;
  album: SearchAlbumsResponse;
};

// ============================================
// Main Class
// ============================================

export default class YMApi {
  private readonly user: ApiUser = {
    password: "",
    token: "",
    uid: 0,
    username: ""
  };

  private serverOffsetCache: ServerOffsetCache | null = null;

  constructor(
    private readonly httpClient = new HttpClientImproved(DEFAULT_HTTP_CONFIG),
    private readonly config: ApiConfig = fallbackConfig
  ) {}

  // ============================================
  // Private Helpers
  // ============================================

  private get authHeader(): { Authorization: string } {
    return { Authorization: `OAuth ${this.user.token}` };
  }

  private get deviceHeader(): { "X-Yandex-Music-Device": string } {
    return {
      "X-Yandex-Music-Device":
        "os=unknown; os_version=unknown; manufacturer=unknown; model=unknown; clid=; device_id=unknown; uuid=unknown"
    };
  }

  private resolveUserId(userId: UserId): number | string {
    return userId == null || userId === 0 || userId === ""
      ? this.user.uid
      : userId;
  }

  private assertAuthenticated(): void {
    if (!this.user.token) {
      throw new AuthError("User token is missing");
    }
  }

  /** Creates an authenticated API request */
  private createRequest(path: string): RequestInterface {
    return apiRequest().setPath(path).addHeaders(this.authHeader);
  }

  /** Generic GET request with result extraction */
  private async get<T>(
    request: RequestInterface,
    responseType?: ResponseType
  ): Promise<T> {
    const response = await this.httpClient.get<ApiResponse<T>>(
      request,
      responseType
    );
    return response.result;
  }

  /** Generic POST request with result extraction */
  private async post<T>(
    request: RequestInterface,
    responseType?: ResponseType
  ): Promise<T> {
    const response = await this.httpClient.post<ApiResponse<T>>(
      request,
      responseType
    );
    return response.result;
  }

  // ============================================
  // Authentication
  // ============================================

  /**
   * POST: /token
   * @ru Инициализация API клиента с аутентификацией.
   * @en Initialize API client with authentication.
   * @param config Параметры конфигурации API.
   * @returns Промис с данными авторизации.
   */
  async init(config: ApiInitConfig): Promise<InitResponse> {
    if (config.access_token && config.uid) {
      this.user.token = config.access_token;
      this.user.uid = config.uid;
      return { access_token: config.access_token, uid: config.uid };
    }

    if (!config.username || !config.password) {
      throw new AuthError(
        "username && password || access_token && uid must be set"
      );
    }

    this.user.username = config.username;
    this.user.password = config.password;

    const data = await this.get<InitResponse>(
      authRequest().setPath("/token").setQuery({
        grant_type: "password",
        username: this.user.username,
        password: this.user.password,
        client_id: this.config.oauth.CLIENT_ID,
        client_secret: this.config.oauth.CLIENT_SECRET
      })
    );

    this.user.token = data.access_token;
    this.user.uid = data.uid;
    return data;
  }

  // ============================================
  // Account & Feed
  // ============================================

  /**
   * GET: /account/status
   * @ru Получить статус аккаунта текущего пользователя.
   * @en Get account status of current user.
   * @returns Promise с информацией об аккаунте.
   */
  getAccountStatus(): Promise<GetAccountStatusResponse> {
    return this.get(this.createRequest("/account/status"));
  }

  /**
   * GET: /feed
   * @ru Получить ленту активности пользователя.
   * @en Get user's activity feed.
   * @returns Promise с лентой активности.
   */
  getFeed(): Promise<GetFeedResponse> {
    return this.get(this.createRequest("/feed"));
  }

  // ============================================
  // Landing Pages
  // ============================================

  /**
   * GET: /landing3/chart/{chartType}
   * @ru Получить треки из чарта.
   * @en Get tracks from chart.
   * @param chartType Тип чарта (россия или мир).
   * @returns Promise с треками чарта.
   */
  getChart(chartType: ChartType): Promise<ChartTracksResponse> {
    return this.get(this.createRequest(`/landing3/chart/${chartType}`));
  }

  /**
   * GET: /landing3/new-playlists
   * @ru Получить новые плейлисты.
   * @en Get new playlists.
   * @returns Promise с новыми плейлистами.
   */
  getNewPlaylists(): Promise<NewPlaylistsResponse> {
    return this.get(this.createRequest("/landing3/new-playlists"));
  }

  /**
   * GET: /landing3/new-releases
   * @ru Получить новые релизы.
   * @en Get new releases.
   * @returns Promise с новыми релизами.
   */
  getNewReleases(): Promise<NewReleasesResponse> {
    return this.get(this.createRequest("/landing3/new-releases"));
  }

  /**
   * GET: /landing3/podcasts
   * @ru Получить подкасты.
   * @en Get podcasts.
   * @returns Promise с подкастами.
   */
  getPodcasts(): Promise<PodcastsResponse> {
    return this.get(this.createRequest("/landing3/podcasts"));
  }

  /**
   * GET: /genres
   * @ru Получить список музыкальных жанров.
   * @en Get list of music genres.
   * @returns Promise со списком жанров.
   */
  getGenres(): Promise<GetGenresResponse> {
    return this.get(this.createRequest("/genres"));
  }

  // ============================================
  // Search
  // ============================================

  /**
   * GET: /search
   * @ru Поиск контента в Yandex Music.
   * @en Search content in Yandex Music.
   * @param query Строка поиска.
   * @param options Опции поиска.
   * @returns Promise с результатами поиска.
   */
  async search<T extends SearchType = "all">(
    query: string,
    options: SearchOptions & { type?: T } = {}
  ): Promise<SearchResponseMap[T]> {
    const request = this.createRequest("/search").setQuery({
      type: options.type ?? "all",
      text: query,
      page: String(options.page ?? 0),
      nocorrect: String(options.nococrrect ?? false) // API typo preserved
    });

    if (options.pageSize !== undefined) {
      request.addQuery({ pageSize: String(options.pageSize) });
    }

    return this.get<SearchResponseMap[T]>(request);
  }

  /**
   * @ru Поиск исполнителей.
   * @en Search for artists.
   * @param query Строка поиска.
   * @param options Опции поиска.
   * @returns Promise с результатами поиска исполнителей.
   */
  searchArtists(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchArtistsResponse> {
    return this.search(query, { ...options, type: "artist" });
  }

  /**
   * @ru Поиск треков.
   * @en Search for tracks.
   * @param query Строка поиска.
   * @param options Опции поиска.
   * @returns Promise с результатами поиска треков.
   */
  searchTracks(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchTracksResponse> {
    return this.search(query, { ...options, type: "track" });
  }

  /**
   * @ru Поиск альбомов.
   * @en Search for albums.
   * @param query Строка поиска.
   * @param options Опции поиска.
   * @returns Promise с результатами поиска альбомов.
   */
  searchAlbums(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchAlbumsResponse> {
    return this.search(query, { ...options, type: "album" });
  }

  /**
   * @ru Поиск контента всех типов.
   * @en Search all content types.
   * @param query Строка поиска.
   * @param options Опции поиска.
   * @returns Promise с результатами поиска всех типов.
   */
  searchAll(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchAllResponse> {
    return this.search(query, { ...options, type: "all" });
  }

  // ============================================
  // Playlists
  // ============================================

  /**
   * GET: /users/{uid}/playlists/list
   * @ru Получить плейлисты пользователя.
   * @en Get user's playlists.
   * @param userId ID пользователя (опционально).
   * @returns Promise с массивом плейлистов.
   */
  getUserPlaylists(userId: UserId = null): Promise<Playlist[]> {
    const uid = this.resolveUserId(userId);
    return this.get(this.createRequest(`/users/${uid}/playlists/list`));
  }

  /**
   * GET: /users/{uid}/playlists/{id} or GET: /playlist/{id}
   * @ru Получить плейлист по ID.
   * @en Get playlist by ID.
   * @param playlistId Идентификатор плейлиста.
   * @param user ID пользователя (для числовых ID).
   * @returns Promise с плейлистом.
   */
  getPlaylist(playlistId: number, user?: UserId): Promise<Playlist>;
  getPlaylist(playlistId: string): Promise<Playlist>;
  getPlaylist(
    playlistId: number | string,
    user: UserId = null
  ): Promise<Playlist> {
    if (typeof playlistId === "number") {
      const uid = this.resolveUserId(user);
      return this.get(
        this.createRequest(`/users/${uid}/playlists/${playlistId}`)
      );
    }

    const normalizedId = playlistId.replace("/playlists/", "/playlist/");
    return this.get(
      this.createRequest(`/playlist/${normalizedId}`).addQuery({
        richTracks: "true"
      })
    );
  }

  /** @deprecated Используйте getPlaylist(string) вместо этого метода.
   *  @en Use getPlaylist(string) instead of this method. */
  getPlaylistNew(playlistId: string): Promise<Playlist> {
    return this.getPlaylist(playlistId);
  }

  /**
   * GET: /users/{uid}/playlists
   * @ru Получить несколько плейлистов.
   * @en Get multiple playlists.
   * @param playlists Массив ID плейлистов.
   * @param user ID пользователя.
   * @param options Опции загрузки.
   * @returns Promise с массивом плейлистов.
   */
  getPlaylists(
    playlists: number[],
    user: UserId = null,
    options: { mixed?: boolean; "rich-tracks"?: boolean } = {}
  ): Promise<Playlist[]> {
    const uid = this.resolveUserId(user);
    return this.get(
      this.createRequest(`/users/${uid}/playlists`).setQuery({
        kinds: playlists.join(),
        mixed: String(options.mixed ?? false),
        "rich-tracks": String(options["rich-tracks"] ?? false)
      })
    );
  }

  /**
   * POST: /users/{uid}/playlists/create
   * @ru Создать новый плейлист.
   * @en Create new playlist.
   * @param name Название плейлиста.
   * @param options Опции видимости.
   * @returns Promise с созданным плейлистом.
   */
  async createPlaylist(
    name: string,
    options: { visibility?: "public" | "private" } = {}
  ): Promise<Playlist> {
    if (!name)
      throw new YMApiError("Playlist name is required", "INVALID_INPUT");

    return this.post(
      this.createRequest(`/users/${this.user.uid}/playlists/create`)
        .addHeaders({ "content-type": "application/x-www-form-urlencoded" })
        .setBodyData({
          title: name,
          visibility: options.visibility ?? "private"
        })
    );
  }

  /**
   * POST: /users/{uid}/playlists/{id}/delete
   * @ru Удалить плейлист.
   * @en Delete playlist.
   * @param playlistId ID плейлиста.
   * @returns Promise с результатом удаления.
   */
  removePlaylist(playlistId: number): Promise<"ok" | string> {
    return this.post(
      this.createRequest(
        `/users/${this.user.uid}/playlists/${playlistId}/delete`
      )
    );
  }

  /**
   * POST: /users/{uid}/playlists/{id}/name
   * @ru Переименовать плейлист.
   * @en Rename playlist.
   * @param playlistId ID плейлиста.
   * @param name Новое название.
   * @returns Promise с обновленным плейлистом.
   */
  renamePlaylist(playlistId: number, name: string): Promise<Playlist> {
    return this.post(
      this.createRequest(
        `/users/${this.user.uid}/playlists/${playlistId}/name`
      ).setBodyData({ value: name })
    );
  }

  /**
   * POST: /users/{uid}/playlists/{id}/change-relative
   * @ru Добавить треки в плейлист.
   * @en Add tracks to playlist.
   * @param playlistId ID плейлиста.
   * @param tracks Массив треков для добавления.
   * @param revision Ревизия плейлиста.
   * @param options Опции позиции.
   * @returns Promise с обновленным плейлистом.
   */
  addTracksToPlaylist(
    playlistId: number,
    tracks: Array<{ id: number; albumId: number }>,
    revision: number,
    options: { at?: number } = {}
  ): Promise<Playlist> {
    return this.post(
      this.createRequest(
        `/users/${this.user.uid}/playlists/${playlistId}/change-relative`
      )
        .addHeaders({ "content-type": "application/x-www-form-urlencoded" })
        .setBodyData({
          diff: JSON.stringify([{ op: "insert", at: options.at ?? 0, tracks }]),
          revision: String(revision)
        })
    );
  }

  /**
   * POST: /users/{uid}/playlists/{id}/change-relative
   * @ru Удалить треки из плейлиста.
   * @en Remove tracks from playlist.
   * @param playlistId ID плейлиста.
   * @param tracks Массив треков для удаления.
   * @param revision Ревизия плейлиста.
   * @param options Опции диапазона.
   * @returns Promise с обновленным плейлистом.
   */
  removeTracksFromPlaylist(
    playlistId: number,
    tracks: Array<{ id: number; albumId: number }>,
    revision: number,
    options: { from?: number; to?: number } = {}
  ): Promise<Playlist> {
    return this.post(
      this.createRequest(
        `/users/${this.user.uid}/playlists/${playlistId}/change-relative`
      ).setBodyData({
        diff: JSON.stringify([
          {
            op: "delete",
            from: options.from ?? 0,
            to: options.to ?? tracks.length,
            tracks
          }
        ]),
        revision: String(revision)
      })
    );
  }

  // ============================================
  // Tracks
  // ============================================

  /**
   * @ru Получить информацию о треке по ID.
   * @en Get track information by ID.
   * @param trackId Идентификатор трека.
   * @returns Promise с информацией о треке.
   */
  getTrack(trackId: TrackId): Promise<GetTrackResponse> {
    return this.get(
      this.createRequest(`/tracks/${trackId}`).addHeaders({
        "content-type": "application/json"
      })
    );
  }

  /**
   * @ru Получить одиночный трек по ID.
   * @en Get single track by ID.
   * @param trackId Идентификатор трека.
   * @returns Promise с треком.
   */
  async getSingleTrack(trackId: TrackId): Promise<Track> {
    const tracks = await this.getTrack(trackId);
    if (!tracks?.length) throw new TrackNotFoundError(trackId);
    return tracks[0];
  }

  /**
   * @ru Получить дополнительную информацию о треке.
   * @en Get additional track information.
   * @param trackId Идентификатор трека.
   * @returns Promise с дополнительной информацией.
   */
  getTrackSupplement(trackId: TrackId): Promise<GetTrackSupplementResponse> {
    return this.get(this.createRequest(`/tracks/${trackId}/supplement`));
  }

  /**
   * @ru Получить похожие треки.
   * @en Get similar tracks.
   * @param trackId Идентификатор трека.
   * @returns Promise с похожими треками.
   */
  getSimilarTracks(trackId: TrackId): Promise<SimilarTracksResponse> {
    return this.get(this.createRequest(`/tracks/${trackId}/similar`));
  }

  /**
   * @ru Получить информацию для скачивания трека.
   * @en Get track download information.
   * @param trackId Идентификатор трека.
   * @param quality Качество загрузки.
   * @param canUseStreaming Разрешить использование стриминга.
   * @returns Promise с информацией о загрузке.
   */
  async getTrackDownloadInfo(
    trackId: TrackId,
    quality = DownloadTrackQuality.Lossless,
    canUseStreaming = true
  ): Promise<GetTrackDownloadInfoResponse> {
    const ts = Math.floor(Date.now() / 1000);
    const sign = this.generateTrackSignature(
      ts,
      String(trackId),
      quality,
      "mp3",
      "raw"
    );

    return this.get(
      this.createRequest(`/tracks/${trackId}/download-info`).addQuery({
        ts: String(ts),
        can_use_streaming: String(canUseStreaming),
        sign
      })
    );
  }

  /**
   * @ru Получить информацию для скачивания трека (новый метод).
   * @en Get track download information (new method).
   * @param trackId Идентификатор трека.
   * @param quality Качество загрузки.
   * @param codecs Кодеки.
   * @param transport Тип транспорта.
   * @returns Promise с информацией о файле.
   */
  async getTrackDownloadInfoNew(
    trackId: number,
    quality = DownloadTrackQuality.Lossless,
    codecs: Codecs = "flac,aac,he-aac,mp3,flac-mp4,aac-mp4,he-aac-mp4",
    transport: Transport = "encraw"
  ): Promise<FileInfoResponseNew> {
    this.assertAuthenticated();

    const offset = await this.getYandexServerOffset();
    const ts = Math.floor(Date.now() / 1000 + offset);
    const sign = this.generateTrackSignature(
      ts,
      String(trackId),
      quality,
      codecs,
      transport
    );

    return this.get(
      this.createRequest("/get-file-info").addQuery({
        ts: String(ts),
        trackId: String(trackId),
        quality,
        codecs,
        transports: transport,
        sign
      })
    );
  }

  /**
   * @ru Получить прямую ссылку на скачивание трека.
   * @en Get direct download link for track.
   * @param trackDownloadUrl URL для скачивания.
   * @param short Использовать короткую ссылку.
   * @returns Promise со ссылкой для скачивания.
   */
  async getTrackDirectLink(
    trackDownloadUrl: string,
    short = false
  ): Promise<string> {
    const request = directLinkRequest(trackDownloadUrl);
    const rawResponse = await this.httpClient.get<any>(request, "xml");

    const downloadInfo = rawResponse["download-info"];
    if (!downloadInfo)
      throw new DownloadInfoError("Download info missing in response");

    const { host, path, ts, s } = downloadInfo;
    const sign = crypto
      .createHash("md5")
      .update(DIRECT_LINK_SALT + path.slice(1) + s)
      .digest("hex");

    const link = `https://${host}/get-mp3/${sign}/${ts}${path}`;
    return short ? shortenLink(link) : link;
  }

  /**
   * @ru Получить прямую ссылку на трек (новый метод).
   * @en Get direct track link (new method).
   * @param trackUrl URL трека.
   * @returns Прямая ссылка на трек.
   */
  getTrackDirectLinkNew(trackUrl: string): string {
    return trackUrl;
  }

  /**
   * @ru Извлечь ID трека из URL.
   * @en Extract track ID from URL.
   * @param url URL трека.
   * @returns ID трека.
   */
  extractTrackId(url: string): string {
    const match = url.match(/\/track\/(\d+)/);
    if (!match) throw new InvalidUrlError(url);
    return match[1];
  }

  /**
   * @ru Получить ссылку для поделиться треком.
   * @en Get share link for track.
   * @param track Трек или ID трека.
   * @returns Promise со ссылкой для поделиться.
   */
  async getTrackShareLink(track: TrackId | Track): Promise<string> {
    const [albumId, trackId] =
      typeof track === "object"
        ? [track.albums[0].id, track.id]
        : [(await this.getSingleTrack(track)).albums[0].id, Number(track)];

    return `https://music.yandex.ru/album/${albumId}/track/${trackId}`;
  }

  // ============================================
  // Albums
  // ============================================

  /**
   * @ru Получить информацию об альбоме.
   * @en Get album information.
   * @param albumId Идентификатор альбома.
   * @param withTracks Включать треки в ответ.
   * @returns Promise с информацией об альбоме.
   */
  getAlbum(
    albumId: AlbumId,
    withTracks = false
  ): Promise<Album | AlbumWithTracks> {
    const path = withTracks
      ? `/albums/${albumId}/with-tracks`
      : `/albums/${albumId}`;
    return this.get(this.createRequest(path));
  }

  /**
   * @ru Получить альбом с треками.
   * @en Get album with tracks.
   * @param albumId Идентификатор альбома.
   * @returns Promise с альбомом и треками.
   */
  getAlbumWithTracks(albumId: AlbumId): Promise<AlbumWithTracks> {
    return this.getAlbum(albumId, true) as Promise<AlbumWithTracks>;
  }

  /**
   * @ru Получить информацию о нескольких альбомах.
   * @en Get information about multiple albums.
   * @param albumIds Массив ID альбомов.
   * @returns Promise с массивом альбомов.
   */
  getAlbums(albumIds: AlbumId[]): Promise<Album[]> {
    return this.post(
      this.createRequest("/albums").setBodyData({ albumIds: albumIds.join() })
    );
  }

  // ============================================
  // Artists
  // ============================================

  /**
   * @ru Получить информацию об исполнителе.
   * @en Get artist information.
   * @param artistId Идентификатор исполнителя.
   * @returns Promise с полной информацией об исполнителе.
   */
  getArtist(artistId: ArtistId): Promise<FilledArtist> {
    return this.get(this.createRequest(`/artists/${artistId}`));
  }

  /**
   * @ru Получить информацию о нескольких исполнителях.
   * @en Get information about multiple artists.
   * @param artistIds Массив ID исполнителей.
   * @returns Promise с массивом исполнителей.
   */
  getArtists(artistIds: ArtistId[]): Promise<Artist[]> {
    return this.post(
      this.createRequest("/artists").setBodyData({
        artistIds: artistIds.join()
      })
    );
  }

  /**
   * @ru Получить треки исполнителя.
   * @en Get artist tracks.
   * @param artistId Идентификатор исполнителя.
   * @param options Опции пагинации.
   * @returns Promise с треками исполнителя.
   */
  getArtistTracks(
    artistId: ArtistId,
    options: SearchOptions = {}
  ): Promise<ArtistTracksResponse> {
    const request = this.createRequest(`/artists/${artistId}/tracks`).setQuery({
      page: String(options.page ?? 0)
    });

    if (options.pageSize !== undefined) {
      request.addQuery({ pageSize: String(options.pageSize) });
    }

    return this.get(request);
  }

  // ============================================
  // User Preferences
  // ============================================

  /**
   * @ru Получить понравившиеся треки пользователя.
   * @en Get user's liked tracks.
   * @param userId ID пользователя (опционально).
   * @returns Promise с понравившимися треками.
   */
  getLikedTracks(userId: UserId = null): Promise<DisOrLikedTracksResponse> {
    const uid = this.resolveUserId(userId);
    return this.get(this.createRequest(`/users/${uid}/likes/tracks`));
  }

  /**
   * @ru Получить не понравившиеся треки пользователя.
   * @en Get user's disliked tracks.
   * @param userId ID пользователя (опционально).
   * @returns Promise с не понравившимися треками.
   */
  getDislikedTracks(userId: UserId = null): Promise<DisOrLikedTracksResponse> {
    const uid = this.resolveUserId(userId);
    return this.get(this.createRequest(`/users/${uid}/dislikes/tracks`));
  }

  // ============================================
  // Radio Stations (Rotor)
  // ============================================

  /**
   * @ru Получить список всех радиостанций.
   * @en Get list of all radio stations.
   * @param language Язык для списка станций.
   * @returns Promise со списком радиостанций.
   */
  getAllStationsList(language?: Language): Promise<AllStationsListResponse> {
    const request = this.createRequest("/rotor/stations/list");
    if (language) request.setQuery({ language });
    return this.get(request);
  }

  /**
   * @ru Получить рекомендованные радиостанции.
   * @en Get recommended radio stations.
   * @returns Promise с рекомендованными радиостанциями.
   */
  getRecomendedStationsList(): Promise<RecomendedStationsListResponse> {
    return this.get(this.createRequest("/rotor/stations/dashboard"));
  }

  /**
   * @ru Получить треки радиостанции.
   * @en Get radio station tracks.
   * @param stationId ID радиостанции.
   * @param queue ID предыдущего трека.
   * @returns Promise с треками станции.
   */
  getStationTracks(
    stationId: string,
    queue?: string
  ): Promise<StationTracksResponse> {
    const request = this.createRequest(`/rotor/station/${stationId}/tracks`);
    if (queue) request.addQuery({ queue });
    return this.get(request);
  }

  /**
   * @ru Получить информацию о радиостанции.
   * @en Get radio station information.
   * @param stationId ID радиостанции.
   * @returns Promise с информацией о станции.
   */
  getStationInfo(stationId: string): Promise<StationInfoResponse> {
    return this.get(this.createRequest(`/rotor/station/${stationId}/info`));
  }

  /**
   * @ru Создать сессию Rotor.
   * @en Create Rotor session.
   * @param seeds Массив ID станций.
   * @param includeTracksInResponse Включать треки в ответ.
   * @returns Promise с созданной сессией.
   */
  createRotorSession(
    seeds: string[],
    includeTracksInResponse = true
  ): Promise<RotorSessionCreateResponse> {
    const body: RotorSessionCreateBody = { seeds, includeTracksInResponse };
    return this.post(
      this.createRequest("/rotor/session/new").setBodyData(body as any)
    );
  }

  /**
   * @ru Получить треки сессии Rotor.
   * @en Get Rotor session tracks.
   * @param sessionId ID сессии.
   * @param options Опции запроса.
   * @returns Promise с треками сессии.
   */
  postRotorSessionTracks(
    sessionId: string,
    options?: { queue?: string[]; batchId?: string }
  ): Promise<RotorSessionCreateResponse> {
    const body: Record<string, unknown> = {};
    if (options?.queue) body.queue = options.queue;
    if (options?.batchId) body.batchId = options.batchId;

    return this.post(
      this.createRequest(`/rotor/session/${sessionId}/tracks`).setBodyData(
        body as any
      )
    );
  }

  // ============================================
  // Queues
  // ============================================

  /**
   * @ru Получить список очередей воспроизведения.
   * @en Get list of playback queues.
   * @returns Promise со списком очередей.
   */
  getQueues(): Promise<QueuesResponse> {
    return this.get(
      this.createRequest("/queues").addHeaders(this.deviceHeader)
    );
  }

  /**
   * @ru Получить информацию об очереди воспроизведения.
   * @en Get playback queue information.
   * @param queueId ID очереди.
   * @returns Promise с информацией об очереди.
   */
  getQueue(queueId: string): Promise<QueueResponse> {
    return this.get(this.createRequest(`/queues/${queueId}`));
  }

  // ============================================
  // Private: Server Time & Signatures
  // ============================================

  private async getYandexServerOffset(
    retries = 3,
    timeoutMs = 2000
  ): Promise<number> {
    if (this.serverOffsetCache) {
      const age = Date.now() - this.serverOffsetCache.timestamp;
      if (age < SERVER_OFFSET_CACHE_TTL) {
        return this.serverOffsetCache.value;
      }
    }

    const fetchOffset = async (): Promise<number> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const resp = await fetch("https://api.music.yandex.net", {
          signal: controller.signal
        });

        const dateHeader = resp.headers.get("Date");
        if (!dateHeader) throw new Error("Date header missing");

        const serverTime = Math.floor(new Date(dateHeader).getTime() / 1000);
        const localTime = Math.floor(Date.now() / 1000);
        const offset = serverTime - localTime;

        this.serverOffsetCache = { value: offset, timestamp: Date.now() };
        return offset;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      return await withRetry(fetchOffset, retries);
    } catch {
      return 0;
    }
  }

  private generateTrackSignature(
    ts: number,
    trackId: string,
    quality: string,
    codecs: Codecs,
    transports: Transport
  ): string {
    const signBase = `${ts}${trackId}${quality}${codecs}${transports}`.replace(
      /,/g,
      ""
    );
    return Buffer.from(
      crypto.createHmac("sha256", SIGNATURE_KEY).update(signBase).digest()
    )
      .toString("base64")
      .replace(/=+$/, "");
  }
}
