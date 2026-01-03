// ============================================
// Custom Error Types
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

export class ExtractionError extends YMApiError {
  constructor(
    public readonly entity: string,
    public readonly input: string
  ) {
    super(`Failed to extract ${entity} from: ${input}`, "EXTRACTION_FAILED");
    this.name = "ExtractionError";
  }
}

export class DownloadError extends YMApiError {
  constructor(
    public readonly trackId: TrackId | TrackUrl,
    public readonly codec: DownloadTrackCodec
  ) {
    super(
      `URL not found for track ${trackId} with codec ${codec}`,
      "DOWNLOAD_URL_NOT_FOUND"
    );
    this.name = "DownloadError";
  }
}

// ============================================
// Account & Auth Types
// ============================================

type PlusStatus = {
  hasPlus: boolean;
  isTutorialCompleted: boolean;
};

type Subscription = {
  expires: string;
  vendor: string;
  vendorHelpUrl: string;
  productId: string;
  orderId: number;
  finished: boolean;
};

type SubscriptionStatus = {
  autoRenewable: Subscription[];
  nonAutoRenewableRemainder: Record<string, unknown>;
  canStartTrial: boolean;
  mcdonalds: boolean;
};

type Permissions = {
  until: string;
  values: string[];
  default: string[];
};

type PassportPhone = {
  phone: string;
};

type Account = {
  now: string;
  uid: number;
  login: string;
  region: number;
  fullName: string;
  secondName: string;
  firstName: string;
  displayName: string;
  birthday: string;
  serviceAvailable: boolean;
  hostedUser: boolean;
  "passport-phones": PassportPhone[];
  registeredAt: string;
};

/**
 * @ru Ответ сервера на запрос статуса аккаунта пользователя.
 * @en Server response for user account status request.
 */
export type GetAccountStatusResponse = {
  account: Account;
  permissions: Permissions;
  subscription: SubscriptionStatus;
  subeditor: boolean;
  subeditorLevel: number;
  plus: PlusStatus;
  defaultEmail: string;
};

/**
 * @ru Конфигурация API с данными авторизации и устройства.
 * @en API configuration with OAuth credentials and device info.
 */
export type ApiConfig = {
  oauth: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
  };
  fake_device: {
    DEVICE_ID: string;
    UUID: string;
    PACKAGE_NAME: string;
  };
};

/**
 * @ru Параметры инициализации API клиента.
 * @en API client initialization parameters.
 */
export type ApiInitConfig = {
  access_token?: string;
  uid?: number;
  username?: string;
  password?: string;
};

/**
 * @ru Ответ сервера на запрос авторизации.
 * @en Server response for authorization request.
 */
export type InitResponse = {
  access_token: string;
  uid: number;
};

/**
 * @ru Данные авторизованного пользователя.
 * @en Authorized user data.
 */
export type ApiUser = {
  username: string;
  password: string;
  token: string;
  uid: number;
};

// ============================================
// Feed Types
// ============================================

type GeneratedPlaylistType =
  | "rewind20"
  | "playlistOfTheDay"
  | "missedLikes"
  | "origin"
  | "family"
  | "recentTracks"
  | "neverHeard"
  | "podcasts"
  | "kinopoisk"
  | string;

type GeneratedPlaylist = {
  type: GeneratedPlaylistType;
  ready: boolean;
  notify: boolean;
  data: Playlist;
};

type FeedDayEventTitle = {
  type: string;
  text: string;
};

type FeedDayEventAugmentedArtist = {
  artist: Artist;
  subscribed: true;
};

type FeedDayEventArtist = {
  augmentedArtist: FeedDayEventAugmentedArtist;
  playsDurationMillis: number;
};

type FeedDayEvent = {
  id: string;
  type: string;
  typeForFrom: string;
  title: FeedDayEventTitle[];
  artists?: FeedDayEventArtist[];
  likedTrack?: Track;
  tracks?: Track[];
  radioIsAvailable?: boolean;
  genre?: GenreId;
  albums?: Album[];
  similarToGenre?: GenreId;
  similarGenre?: GenreId;
  similarToArtist?: Artist;
  similarArtists?: Artist[];
  artist?: Artist;
  socialTracks?: Track[];
};

type FeedDayTrackToPlayWithAds = {
  type: string;
  track: Track;
};

type FeedDay = {
  day: string;
  events: FeedDayEvent[];
  tracksToPlay: Track[];
  tracksToPlayWithAds: FeedDayTrackToPlayWithAds[];
};

/**
 * @ru Ответ сервера на запрос ленты активности пользователя.
 * @en Server response for user activity feed request.
 */
export type GetFeedResponse = {
  nextRevision: string;
  canGetMoreEvents: boolean;
  pumpkin: boolean;
  isWizardPassed: boolean;
  generatedPlaylists: GeneratedPlaylist[];
  headlines: unknown[];
  today: string;
  days: FeedDay[];
};

// ============================================
// Playlist Types
// ============================================

type Visibility = "public" | "private" | string;
type Sex = "male" | "female" | string;

type PlaylistOwner = {
  uid: number;
  login: string;
  name: string;
  verified: boolean;
  sex: Sex;
};

type PlaylistTrack = {
  id: number;
  timestamp: string;
  recent: boolean;
  track: Track;
};

type PlaylistCoverType = "mosaic" | string;

type PlaylistCover = {
  error?: string;
  type?: PlaylistCoverType;
  itemsUri?: string[];
  custom?: boolean;
};

/**
 * @ru Структура данных плейлиста.
 * @en Playlist data structure.
 */
export type Playlist = {
  owner: PlaylistOwner;
  playlistUuid: string;
  available: boolean;
  uid: number;
  kind: number;
  title: string;
  revision: number;
  snapshot: number;
  trackCount: number;
  visibility: Visibility;
  collective: boolean;
  created: string;
  modified: string;
  isBanner: boolean;
  isPremiere: boolean;
  durationMs: number;
  cover: PlaylistCover;
  ogImage: string;
  tags: unknown[];
  prerolls: unknown[];
  lastOwnerPlaylists: unknown[];
  tracks?: PlaylistTrack[];
};

// ============================================
// Genre Types
// ============================================

type GenreId =
  | "all"
  | "pop"
  | "allrock"
  | "indie"
  | "metal"
  | "alternative"
  | "electronics"
  | "dance"
  | "rap"
  | "rnb"
  | "jazz"
  | "blues"
  | "reggae"
  | "ska"
  | "punk"
  | "folk"
  | "estrada"
  | "shanson"
  | "country"
  | "soundtrack"
  | "relax"
  | "children"
  | "naturesounds"
  | "bard"
  | "forchildren"
  | "fairytales"
  | "poemsforchildren"
  | "podcasts"
  | "classicalmusic"
  | "fiction"
  | "nonfictionliterature"
  | "booksnotinrussian"
  | "audiobooks"
  | "folkgenre"
  | "other"
  | string;

type RadioIcon = {
  backgroundColor: string;
  imageUrl: string;
};

type Genre = {
  id: GenreId;
  weight: number;
  composerTop: boolean;
  title: string;
  fullTitle: string;
  titles: Record<string, { title: string }>;
  images: Record<string, string>;
  showInMenu: boolean;
  showInRegions?: number[];
  urlPart?: string;
  color?: string;
  radioIcon?: RadioIcon;
  subGenres?: Genre[];
};

/**
 * @ru Ответ сервера со списком музыкальных жанров.
 * @en Server response with list of music genres.
 */
export type GetGenresResponse = Genre[];

// ============================================
// Artist Types
// ============================================

type ArtistCoverType = "from-artist-photos" | string;

type ArtistCover = {
  type: ArtistCoverType;
  prefix: string;
  uri: string;
};

type ArtistCounts = {
  tracks: number;
  directAlbums: number;
  alsoAlbums: number;
  alsoTracks: number;
};

type ArtistRatings = {
  week: number;
  month: number;
  day: number;
};

type ArtistLink = {
  title: string;
  href: string;
  type: string;
  socialNetwork: string;
};

/**
 * @ru Структура данных исполнителя (артиста).
 * @en Artist (performer) data structure.
 */
export type Artist = {
  id: number;
  name: string;
  various: boolean;
  composer: boolean;
  cover: ArtistCover;
  genres: GenreId[];
  disclaimers: string[];
  ogImage?: string;
  noPicturesFromSearch?: boolean;
  counts?: ArtistCounts;
  available?: boolean;
  ratings?: ArtistRatings;
  links?: ArtistLink[];
  ticketsAvailable?: boolean;
  likesCount: number;
  dbAliases: string[];
  popularTracks?: Track[];
};

/**
 * @ru Полная структура данных исполнителя с альбомами.
 * @en Complete artist data structure with albums.
 */
export type FilledArtist = {
  artist: Required<Artist>;
  albums: Album[];
  alsoAlbums: Album[];
  similarArtists: Artist[];
};

/**
 * @ru Идентификатор исполнителя.
 * @en Artist identifier.
 */
export type ArtistId = number;

/**
 * @ru URL исполнителя.
 * @en Artist URL.
 */
export type ArtistUrl = string;

/**
 * @ru Ответ сервера с треками исполнителя.
 * @en Server response with artist tracks.
 */
export type ArtistTracksResponse = {
  pager: Pager;
  tracks: Track[];
};

// ============================================
// Album Types
// ============================================

type AlbumType = "compilation" | string;
type Label = { id: number; name: string } | string;
type AlbumCustomWave = { title: string; animationUrl: string; header: string };

/**
 * @ru Том (диск) альбома с треками.
 * @en Album volume (disc) containing tracks.
 */
export type AlbumVolume = Track[];

/**
 * @ru Структура данных альбома.
 * @en Album data structure.
 */
export type Album = {
  id: number;
  title: string;
  type: AlbumType;
  metaType: string;
  version: string;
  year?: number;
  releaseDate: string;
  coverUri: string;
  ogImage: string;
  genre: GenreId;
  metaTagId?: string;
  trackCount: number;
  recent?: boolean;
  veryImportant: boolean;
  artists: Artist[];
  labels?: Label[];
  available: boolean;
  availableForPremiumUsers: boolean;
  disclaimers: string[];
  availableForOptions: string[];
  availableForMobile: boolean;
  availablePartially: boolean;
  bests: number[];
  duplicates?: Album[];
  customWave?: AlbumCustomWave;
  sortOrder?: string;
  volumes?: AlbumVolume[];
  pager?: Pager;
};

/**
 * @ru Альбом с загруженными треками.
 * @en Album with loaded tracks.
 */
export type AlbumWithTracks = Required<Pick<Album, "volumes">> & Album;

/**
 * @ru Идентификатор альбома.
 * @en Album identifier.
 */
export type AlbumId = number;

/**
 * @ru URL альбома.
 * @en Album URL.
 */
export type AlbumUrl = string;

// ============================================
// Track Types
// ============================================

type TrackMajor = { id: number; name: string };
type TrackContentWarning = "explicit" | string;
type TrackR128 = { i: number; tp: number };

type TrackFade = {
  inStart: number;
  inStop: number;
  outStart: number;
  outStop: number;
};

type TrackLyricsInfo = {
  hasAvailableSyncLyrics: boolean;
  hasAvailableTextLyrics: boolean;
};

/**
 * @ru Структура данных трека (песни).
 * @en Track (song) data structure.
 */
export type Track = {
  id: number;
  realId: string;
  title: string;
  contentWarning?: TrackContentWarning;
  version: string;
  major?: TrackMajor;
  available: boolean;
  availableForPremiumUsers: boolean;
  availableFullWithoutPermission?: boolean;
  disclaimers: string[];
  availableForOptions: string[];
  durationMs: number;
  storageDir?: string;
  fileSize?: number;
  r128: TrackR128;
  fade: TrackFade;
  previewDurationMs?: number;
  artists: Artist[];
  albums: Album[];
  lyricsAvailable: boolean;
  coverUri: string;
  ogImage: string;
  rememberPosition: boolean;
  type: string;
  trackSharingFlag?: string;
  lyricsInfo: TrackLyricsInfo;
  trackSource: string;
};

/**
 * @ru Идентификатор трека.
 * @en Track identifier.
 */
export type TrackId = number;

/**
 * @ru URL трека.
 * @en Track URL.
 */
export type TrackUrl = string;

/**
 * @ru Ответ сервера с массивом треков.
 * @en Server response with array of tracks.
 */
export type GetTrackResponse = Track[];

type Lyrics = {
  id: number;
  lyrics: string;
  fullLyrics: string;
  hasRights: boolean;
  showTranslation: boolean;
  textLanguage: Language;
};

type VideoProvider = "youtube" | string;

type Video = {
  title: string;
  cover: string;
  url: string;
  provider: VideoProvider;
  providerVideoId: string;
  embed: string;
};

/**
 * @ru Дополнительная информация о треке (текст и видео).
 * @en Additional track information (lyrics and videos).
 */
export type GetTrackSupplementResponse = {
  id: number;
  lyrics: Lyrics;
  videos: Video[];
};

/**
 * @ru Ответ сервера с похожими треками.
 * @en Server response with similar tracks.
 */
export type SimilarTracksResponse = {
  track: Track;
  similarTracks: Track[];
};

// ============================================
// Download Types
// ============================================

type AudioCodec =
  | "flac"
  | "aac"
  | "he-aac"
  | "flac-mp4"
  | "aac-mp4"
  | "he-aac-mp4"
  | "mp3"
  | string;

/**
 * @ru Качество загрузки трека.
 * @en Track download quality.
 */
export enum DownloadTrackQuality {
  Lossless = "lossless",
  High = "high",
  Low = "low"
}

/**
 * @ru Кодек для загрузки трека.
 * @en Track download codec.
 */
export enum DownloadTrackCodec {
  FLAC = "flac",
  FLACMP4 = "flac-mp4",
  AAC = "aac",
  AACMP4 = "aac-mp4",
  HEACC = "he-aac",
  HEACCMP4 = "he-aac-mp4",
  MP3 = "mp3"
}

/**
 * @ru Информация о загрузке трека.
 * @en Track download information.
 */
export type DownloadInfo = {
  quality: DownloadTrackQuality;
  codec: AudioCodec;
  gain: boolean;
  preview: boolean;
  downloadInfoUrl: string;
  direct: boolean;
  bitrateInKbps: number;
  encrypted: boolean;
};

/**
 * @ru Ответ сервера с информацией о загрузке треков.
 * @en Server response with track download information.
 */
export type GetTrackDownloadInfoResponse = DownloadInfo[];

/**
 * @ru Информация о файле для загрузки.
 * @en File information for download.
 */
export type FileInfoResponse = {
  file: {
    downloadUrl: string;
    size?: number;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * @ru Новая структура информации о файле для загрузки.
 * @en New file information structure for download.
 */
export type FileInfoResponseNew = {
  downloadInfo: {
    trackId: string;
    quality: string;
    codec: string;
    bitrate: number;
    transport: string;
    size: number;
    gain: boolean;
    url: string;
    urls: string[];
    realId: string;
    [key: string]: unknown;
  };
};

/**
 * @ru Доступные кодеки для загрузки.
 * @en Available codecs for download.
 */
export type Codecs =
  | "flac,aac,he-aac,mp3,flac-mp4,aac-mp4,he-aac-mp4"
  | "flac,aac,he-aac,mp3"
  | "flac-mp4,flac"
  | "flac,aac,he-aac"
  | "flac,aac"
  | "flac"
  | "flac-mp4"
  | "aac"
  | "he-aac"
  | "mp3"
  | "aac-mp4"
  | "he-aac-mp4";

/**
 * @ru Тип транспорта для загрузки.
 * @en Transport type for download.
 */
export type Transport = "raw" | "encraw";

/** @ru Конфигурация кодеков и транспорта.
 *  @en Codec and transport configuration. */
export interface CodecConfig {
  readonly codecs: Codecs;
  readonly transport: Transport;
  readonly encrypted: boolean;
}

/** @ru Опции для методов загрузки.
 *  @en Options for download methods. */
export interface DownloadOptions {
  codec?: DownloadTrackCodec;
  quality?: DownloadTrackQuality;
  forceRaw?: boolean;
}

// ============================================
// Search Types
// ============================================

/**
 * @ru Тип поиска в Yandex Music.
 * @en Search type in Yandex Music.
 */
export type SearchType = "artist" | "album" | "track" | "all";

/**
 * @ru Опции поиска.
 * @en Search options.
 */
export type SearchOptions = {
  type?: SearchType;
  page?: number;
  nococrrect?: boolean; // API typo preserved
  pageSize?: number;
};

/**
 * @ru Конкретные опции поиска без типа.
 * @en Concrete search options without type.
 */
export type ConcreteSearchOptions = Omit<SearchOptions, "type">;

/**
 * @ru Общий ответ сервера на поисковый запрос.
 * @en General server response for search query.
 */
export type SearchResponse = {
  type: string;
  page: number;
  perPage: number;
  text: string;
  searchRequestId: string;
  artists?: {
    total: number;
    perPage: number;
    order: number;
    results: Artist[];
  };
  albums?: {
    total: number;
    perPage: number;
    order: number;
    results: Album[];
  };
  tracks?: {
    total: number;
    perPage: number;
    order: number;
    results: Track[];
  };
  best?: {
    type: "track" | "artist" | "album" | "playlist" | "video";
    results: unknown[];
    misspellCorrected: boolean;
    nocorrect: boolean;
  };
};

/**
 * @ru Ответ поиска по всем типам контента.
 * @en Search response for all content types.
 */
export type SearchAllResponse = Required<SearchResponse>;

/**
 * @ru Ответ поиска по исполнителям.
 * @en Search response for artists.
 */
export type SearchArtistsResponse = Required<Omit<SearchResponse, "tracks">>;

/**
 * @ru Ответ поиска по трекам.
 * @en Search response for tracks.
 */
export type SearchTracksResponse = Required<Omit<SearchResponse, "albums">>;

/**
 * @ru Ответ поиска по альбомам.
 * @en Search response for albums.
 */
export type SearchAlbumsResponse = Required<Omit<SearchResponse, "tracks">>;

/** @ru Соответствие типа поиска и типа ответа.
 *  @en Map search type to response type. */
export type SearchResponseMap = {
  all: SearchAllResponse;
  artist: SearchArtistsResponse;
  track: SearchTracksResponse;
  album: SearchAlbumsResponse;
};

// ============================================
// Playlist & User Types
// ============================================

/**
 * @ru Идентификатор плейлиста.
 * @en Playlist identifier.
 */
export type PlaylistId = number;

/**
 * @ru URL плейлиста.
 * @en Playlist URL.
 */
export type PlaylistUrl = string;

/**
 * @ru Идентификатор пользователя.
 * @en User identifier.
 */
export type UserId = number;

/**
 * @ru Имя пользователя.
 * @en Username.
 */
export type UserName = string;

/** @ru Результат извлечения ID плейлиста.
 *  @en Result of playlist ID extraction. */
export interface PlaylistIdentifier {
  id: PlaylistId | string;
  user: UserName | null;
}

/** @ru Интерфейс для извлечения ID из URL.
 *  @en Interface for extracting IDs from URLs. */
export interface UrlExtractorInterface {
  extractTrackId(url: string): number;
  extractAlbumId(url: string): number;
  extractArtistId(url: string): number;
  extractPlaylistId(url: string): PlaylistIdentifier;
}

// ============================================
// User Preferences Types
// ============================================

type TrackMeta = {
  id: string;
  albumId: string;
  timestamp: string;
};

/**
 * @ru Ответ с понравившимися или не понравившимися треками.
 * @en Response with liked or disliked tracks.
 */
export type DisOrLikedTracksResponse = {
  library: {
    revision: number;
    uid: number;
    tracks: TrackMeta[];
    playlistUuid?: string;
  };
};

// ============================================
// Radio/Rotor Types
// ============================================

type StationTrack = {
  type: string;
  track: Track;
  liked: boolean;
  trackParameters: {
    bpm: number;
    hue: number;
    energy: number;
  };
};

/**
 * @ru Ответ сервера с треками радиостанции.
 * @en Server response with station tracks.
 */
export type StationTracksResponse = {
  id: { type: string; tag: string };
  sequence: StationTrack[];
  batchId: string;
  pumpkin: boolean;
  radioSessionId: string;
};

type StationId = { type: string; tag: string };

type StationSettings = {
  language: string;
  mood?: number;
  energy?: number;
  moodEnergy?: string;
  diversity: string;
};

type StationAdParams = {
  partnerId: string;
  categoryId: string;
  pageRef: string;
  targetRef: string;
  otherParams: string;
  adVolume: number;
};

type StationRestrictionsValue = {
  value: number;
  name: string;
  imageUrl?: string;
  unspecified?: boolean;
  serializedSeed?: string;
};

type StationRestrictionsOption<
  T extends StationRestrictionsValue = StationRestrictionsValue
> = {
  type: string;
  name: string;
  possibleValues?: T[];
  min?: T;
  max?: T;
};

type StationRestrictions = {
  diversity: Required<Omit<StationRestrictionsOption, "max">>;
  language: Required<Omit<StationRestrictionsOption, "max">>;
  mood?: Required<StationRestrictionsOption>;
  energy?: Required<StationRestrictionsOption>;
  moodEnergy?: Required<Omit<StationRestrictionsOption, "max">>;
};

type StationData = {
  artists: Artist[];
  title?: string;
  description?: string;
  imageUri?: string;
};

type StationInfo = {
  station: {
    id: StationId;
    parentId?: StationId;
    name: string;
    icon: RadioIcon;
    mtsIcon: RadioIcon;
    fullImageUrl: string;
    mtsFullImageUrl?: string;
    idForFrom: string;
    restrictions: Required<Omit<StationRestrictions, "moodEnergy">>;
    restrictions2: Required<Omit<StationRestrictions, "energy">>;
    listeners?: number;
    visibility?: string;
    login?: string;
    displayName?: string;
    fullName?: string;
  };
  data?: StationData;
  settings: Required<Omit<StationSettings, "moodEnergy">>;
  settings2: Required<Omit<StationSettings, "energy">>;
  adParams: StationAdParams;
  rupTitle: string;
  rupDescription: string;
};

/**
 * @ru Ответ сервера с информацией о радиостанциях.
 * @en Server response with radio stations information.
 */
export type StationInfoResponse = StationInfo[];

/**
 * @ru Ответ сервера со списком всех радиостанций.
 * @en Server response with list of all radio stations.
 */
export type AllStationsListResponse = StationInfo[];

/**
 * @ru Ответ сервера с рекомендованными радиостанциями.
 * @en Server response with recommended radio stations.
 */
export type RecomendedStationsListResponse = {
  dashboardId: string;
  stations: StationInfo[];
  pumpkin: boolean;
};

/**
 * @ru Тело запроса для создания сессии Rotor.
 * @en Request body for creating Rotor session.
 */
export type RotorSessionCreateBody = {
  seeds: string[];
  includeTracksInResponse?: boolean;
};

type RotorSeed = {
  value: string;
  tag: string;
  type: string;
};

/**
 * @ru Ответ сервера на создание сессии Rotor.
 * @en Server response for Rotor session creation.
 */
export type RotorSessionCreateResponse = {
  radioSessionId: string;
  sequence: StationTrack[];
  batchId: string;
  pumpkin: boolean;
  descriptionSeed?: RotorSeed;
  acceptedSeeds?: RotorSeed[];
  terminated?: boolean;
};

// ============================================
// Charts & Landing Types
// ============================================

/**
 * @ru Тип музыкального чарта.
 * @en Music chart type.
 */
export type ChartType = "russia" | "world";

/**
 * @ru Ответ сервера с треками из чарта.
 * @en Server response with chart tracks.
 */
export type ChartTracksResponse = {
  id: string;
  type: string;
  typeForFrom: string;
  title: string;
  chartDescription: string;
  menu: {
    items: Array<{ title: string; url: string; selected?: boolean }>;
  };
  chart: {
    owner: PlaylistOwner;
    playlistUuid: string;
    available: boolean;
    uid: number;
    kind: number;
    title: string;
    description: string;
    descriptionFormatted: string;
    revision: number;
    snapshot: number;
    trackCount: number;
    visibility: Visibility;
    collective: boolean;
    created: string;
    modified: string;
    isBanner: boolean;
    isPremiere: boolean;
    durationMs: number;
    cover: PlaylistCover;
    ogImage: string;
    tracks: PlaylistTrack[];
    tags: unknown[];
    likesCount: number;
    similarPlaylists: Playlist[];
    backgroundVideoUrl: string;
    backgroundImageUrl: string;
  };
};

/**
 * @ru Ответ сервера с новыми релизами.
 * @en Server response with new releases.
 */
export type NewReleasesResponse = {
  id: string;
  type: string;
  typeForFrom: string;
  title: string;
  newReleases: number[];
};

/**
 * @ru Ответ сервера с новыми плейлистами.
 * @en Server response with new playlists.
 */
export type NewPlaylistsResponse = {
  id: string;
  type: string;
  typeForFrom: string;
  title: string;
  newPlaylists: Array<{ uid: number; kind: number }>;
};

/**
 * @ru Ответ сервера с подкастами.
 * @en Server response with podcasts.
 */
export type PodcastsResponse = {
  type: string;
  typeForFrom: string;
  title: string;
  podcasts: Album[];
};

// ============================================
// Queue Types
// ============================================

type QueueContext = {
  description?: string;
  id?: string;
  type: string;
};

type Queue = {
  id: string;
  context: QueueContext;
  initialContext?: QueueContext;
  modified: string;
};

/**
 * @ru Ответ сервера со списком очередей.
 * @en Server response with list of queues.
 */
export type QueuesResponse = {
  queues: Queue[];
};

type QueueTrack = {
  trackId: string;
  albumId: string;
  from: string;
};

/**
 * @ru Ответ сервера с данными очереди.
 * @en Server response with queue data.
 */
export type QueueResponse = {
  id: string;
  context: QueueContext;
  initialContext?: QueueContext;
  from: string;
  tracks: QueueTrack[];
  currentIndex?: number;
  modified: string;
};

// ============================================
// Utility Types
// ============================================

/**
 * @ru Код языка.
 * @en Language code.
 */
export type Language = "en" | "ru" | string;

/**
 * @ru Информация о пагинации.
 * @en Pagination information.
 */
export type Pager = {
  page: number;
  perPage: number;
  total: number;
};
