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
  autoRenewable: Array<Subscription>;
  nonAutoRenewableRemainder: { [key: string]: any };
  canStartTrial: boolean;
  mcdonalds: boolean;
};
type Permissions = {
  until: string;
  values: Array<string>;
  default: Array<string>;
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
  "passport-phones": Array<PassportPhone>;
  registeredAt: string;
};
export type GetAccountStatusResponse = {
  account: Account;
  permissions: Permissions;
  subscription: SubscriptionStatus;
  subeditor: boolean;
  subeditorLevel: number;
  plus: PlusStatus;
  defaultEmail: string;
};
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
  title: Array<FeedDayEventTitle>;
  artists?: Array<FeedDayEventArtist>;
  likedTrack?: Track;
  tracks?: Array<Track>;
  radioIsAvailable?: boolean;
  genre?: GenreId;
  albums?: Array<Album>;
  similarToGenre?: GenreId;
  similarGenre?: GenreId;
  similarToArtist?: Artist;
  similarArtists?: Array<Artist>;
  artist?: Artist;
  socialTracks?: Array<Track>;
};
type FeedDayTrackToPlayWithAds = {
  type: string;
  track: Track;
};
type FeedDay = {
  day: string;
  events: Array<FeedDayEvent>;
  tracksToPlay: Array<Track>;
  tracksToPlayWithAds: Array<FeedDayTrackToPlayWithAds>;
};
export type GetFeedResponse = {
  nextRevision: string;
  canGetMoreEvents: boolean;
  pumpkin: boolean;
  isWizardPassed: boolean;
  generatedPlaylists: Array<GeneratedPlaylist>;
  headlines: Array<any>;
  today: string;
  days: Array<FeedDay>;
};

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
  itemsUri?: Array<string>;
  custom?: boolean;
};
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
  tags: Array<any>;
  prerolls: Array<any>;
  lastOwnerPlaylists: Array<Playlist>;
  tracks?: Array<PlaylistTrack>;
};

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
  titles: { [key: string]: { title: string } };
  images: { [key: string]: string };
  showInMenu: boolean;
  showInRegions?: Array<number>;
  urlPart?: string;
  color?: string;
  radioIcon?: RadioIcon;
  subGenres?: Array<Genre>;
};
export type GetGenresResponse = Array<Genre>;

export type SearchType = "artist" | "album" | "track" | "all";

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

export type ApiInitConfig = {
  access_token?: string;
  uid?: number;
  username?: string;
  password?: string;
};

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
type AlbumType = "compilation" | string;
type Label = { id: number; name: string } | string;

export type AlbumVolume = Array<Track>;
type AlbumCustomWave = { title: string; animationUrl: string; header: string };
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
  // storageDir?: string;
  veryImportant: boolean;
  artists: Array<Artist>;
  labels?: Array<Label>;
  available: boolean;
  availableForPremiumUsers: boolean;
  disclaimers: Array<any>;
  availableForOptions: Array<any>;
  availableForMobile: boolean;
  availablePartially: boolean;
  bests: Array<number>;
  duplicates?: Array<Album>;
  customWave?: AlbumCustomWave;
  sortOrder?: string;
  volumes?: Array<AlbumVolume>;
  // trackPosition?: TrackPosition;
  // availableRegions?: Array<Region>;
  // originalReleaseYear?: number;
  // likesCount?: number;
  // regions?: Array<Region>;
  pager?: Pager;
};
export type AlbumWithTracks = Required<Album>;

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
  disclaimers: Array<any>;
  availableForOptions: Array<string>;
  durationMs: number;
  storageDir?: string;
  fileSize?: number;
  r128: TrackR128;
  fade: TrackFade;
  previewDurationMs?: number;
  artists: Array<Artist>;
  albums: Array<Album>;
  lyricsAvailable: boolean;
  coverUri: string;
  ogImage: string;
  rememberPosition: boolean;
  type: string;
  trackSharingFlag?: string;
  lyricsInfo: TrackLyricsInfo;
  trackSource: string;
};

type ArtistRatings = { week: number; month: number; day: number };
type ArtistLink = {
  title: string;
  href: string;
  type: string;
  socialNetwork: string;
};
export type Artist = {
  id: number;
  name: string;
  various: boolean;
  composer: boolean;
  cover: ArtistCover;
  genres: Array<Genre>;
  disclaimers: Array<any>;
  ogImage?: string;
  noPicturesFromSearch?: boolean;
  counts?: ArtistCounts;
  available?: boolean;
  ratings?: ArtistRatings;
  links?: Array<ArtistLink>;
  ticketsAvailable?: boolean;
  likesCount: number;
  dbAliases: Array<string>;
  popularTracks?: Array<Track>;
  // regions?: Array<Region>;
  // albums?: Array<Album>;
  // alsoAlbums?: Array<Album>;
  // similarArtists?: Array<Artist>;
};
export type FilledArtist = {
  artist: Required<Artist>;
  albums: Array<Album>;
  alsoAlbums: Array<Album>;
  similarArtists: Array<Artist>;
};

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
    results: Array<Artist>;
  };
  albums?: {
    total: number;
    perPage: number;
    order: number;
    results: Array<Album>;
  };
  tracks?: {
    total: number;
    perPage: number;
    order: number;
    results: Array<Track>;
  };
  best?: {
    type: "track" | "artist" | "album" | "playlist" | "video";
    results: Array<Track | Artist | Album | Playlist | Video>;
    misspellCorrected: boolean;
    nocorrect: boolean;
  };
};

export type ArtistTracksResponse = {
  pager: Pager;
  tracks: Array<Track>;
};

export type SearchAllResponse = Required<SearchResponse>;
export type SearchArtistsResponse = Required<
  Omit<Omit<SearchResponse, "albums">, "tracks">
>;
export type SearchTracksResponse = Required<
  Omit<Omit<SearchResponse, "artists">, "albums">
>;
export type SearchAlbumsResponse = Required<
  Omit<Omit<SearchResponse, "artists">, "tracks">
>;

export type GetTrackResponse = Array<Track>;

export type Language = "en" | "ru" | string;
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
export type GetTrackSupplementResponse = {
  id: number;
  lyrics: Lyrics;
  videos: Array<Video>;
};

type AudioCodec = "mp3" | "aac" | "flac" | string;
export type DownloadInfo = {
  quality: DownloadTrackQuality;
  codec: AudioCodec;
  gain: boolean;
  preview: boolean;
  downloadInfoUrl: string;
  direct: boolean;
  bitrateInKbps: number;
};
export type GetTrackDownloadInfoResponse = Array<DownloadInfo>;

export type InitResponse = {
  access_token: string;
  uid: number;
};

export type ArtistId = number;
export type ArtistUrl = string;

export type AlbumId = number;
export type AlbumUrl = string;

export type TrackId = number;
export type TrackUrl = string;

export type PlaylistId = number;
export type PlaylistUrl = string;

export type UserId = number;
export type UserName = string;

export interface UrlExtractorInterface {
  extractTrackId(url: string): number;
  extractAlbumId(url: string): number;
  extractArtistId(url: string): number;
  extractPlaylistId(url: string): { id: number | string; user: string | null };
}

export type ApiUser = {
  username: string;
  password: string;
  token: string;
  uid: number;
};

export enum DownloadTrackQuality {
  Lossless = "lossless",
  High = "high",
  Low = "low"
}

export enum DownloadTrackCodec {
  FLAC = "flac",
  AAC = "aac",
  HEACC = "he-aac",
  MP3 = "mp3"
}

export type SearchOptions = {
  type?: SearchType;
  page?: number;
  nococrrect?: boolean;
  pageSize?: number;
};

export type ConcreteSearchOptions = Omit<SearchOptions, "type">;

export type Pager = {
  page: number;
  perPage: number;
  total: number;
};

type TrackMeta = {
  id: string;
  albumId: string;
  timestamp: string;
};

export type DisOrLikedTracksResponse = {
  library: {
    revision: number;
    uid: number;
    tracks: TrackMeta[];
    playlistUuid?: string;
  };
};

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

export type StationTracksResponse = {
  id: { type: string; tag: string };
  sequence: Array<StationTrack>;
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
type StationRestrictionsOption = {
  type: string;
  name: string;
  possibleValues?: Array<Required<StationRestrictionsValue>>;
  min?: StationRestrictionsValue;
  max?: StationRestrictionsValue;
};
type StationRestrictions = {
  diversity: Required<Omit<Omit<StationRestrictionsOption, "min">, "max">>;
  language: Required<Omit<Omit<StationRestrictionsOption, "min">, "max">>;
  mood?: Required<Omit<StationRestrictionsOption, "possibleValues">>;
  energy?: Required<Omit<StationRestrictionsOption, "possibleValues">>;
  moodEnergy?: Required<Omit<Omit<StationRestrictionsOption, "min">, "max">>;
};
type StationData = {
  artists: Array<Artist>;
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
    restrictions2: Required<Omit<Omit<StationRestrictions, "mood">, "energy">>;
    listeners?: number;
    visibility?: string;
    login?: string;
    displayName?: string;
    fullName?: string;
  };
  data?: StationData;
  settings: Required<Omit<StationInfo, "moodEnergy">>;
  settings2: Required<Omit<Omit<StationSettings, "mood">, "energy">>;
  adParams: StationAdParams;
  rupTitle: string;
  rupDescription: string;
};

export type StationInfoResponse = Array<StationInfo>;

export type AllStationsListResponse = Array<StationInfo>;

export type RecomendedStationsListResponse = {
  dashboardId: string;
  stations: Array<StationInfo>;
  pumpkin: boolean;
};

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
    tracks: Array<PlaylistTrack>;
    tags: Array<any>;
    likesCount: number;
    similarPlaylists: Array<Playlist>;
    backgroundVideoUrl: string;
    backgroundImageUrl: string;
  };
};

export type ChartType = "russia" | "world";

export type NewReleasesResponse = {
  id: string;
  type: string;
  typeForFrom: string;
  title: string;
  newReleases: Array<number>;
};

export type NewPlaylistsResponse = {
  id: string;
  type: string;
  typeForFrom: string;
  title: string;
  newPlaylists: Array<{ uid: number; kind: number }>;
};

export type PodcastsResponse = {
  type: string;
  typeForFrom: string;
  title: string;
  podcasts: Array<number>;
};

export type SimilarTracksResponse = {
  track: Track;
  similarTracks: Array<Track>;
};

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

export type QueuesResponse = {
  queues: Array<Queue>;
};

type QueueTrack = {
  trackId: string;
  albumId: string;
  from: string;
};

export type QueueResponse = {
  id: string;
  context: QueueContext;
  initialContext?: QueueContext;
  from: string;
  tracks: Array<QueueTrack>;
  currentIndex?: number;
  modified: string;
};

// Rotor session
export type RotorSessionCreateBody = {
  seeds: Array<string>;
  includeTracksInResponse?: boolean;
};

type RotorSeed = {
  value: string;
  tag: string;
  type: string;
};

export type RotorSessionCreateResponse = {
  radioSessionId: string;
  sequence: Array<StationTrack>;
  batchId: string;
  pumpkin: boolean;
  descriptionSeed?: RotorSeed;
  acceptedSeeds?: Array<RotorSeed>;
  terminated?: boolean;
};

export type FileInfoResponse = {
  file: {
    downloadUrl: string;
    size?: number;
    type?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export type FileInfoResponseNew = {
  downloadInfo: {
    trackId: string;
    quality: string;
    codec: string;
    bitrate: number;
    transport: string;
    size: number;
    gain: boolean;
    url: string; // основной URL
    urls: string[]; // альтернативные ссылки
    realId: string;
    [key: string]: any;
  };
};
