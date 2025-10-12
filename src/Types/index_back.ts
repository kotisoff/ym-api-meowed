// Re-export all types
export * from "./request";

// Core types
export type TrackId = number | string;
export type AlbumId = number;
export type ArtistId = number;
export type PlaylistId = number | string;
export type UserId = number;
export type UserName = string;

export type TrackUrl = string;
export type AlbumUrl = string;
export type ArtistUrl = string;
export type PlaylistUrl = string;

export enum DownloadTrackQuality {
  Lossless = "lossless",
  High = "high",
  Medium = "medium",
  Low = "low"
}

export enum DownloadTrackCodec {
  MP3 = "mp3",
  AAC = "aac",
  FLAC = "flac"
}

export enum ChartType {
  World = "world",
  Russia = "russia"
}

export type Language = "en" | "ru" | "uk" | "tr";

// API Configuration
export interface ApiConfig {
  oauth: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
  };
  fake_device: {
    DEVICE_ID: string;
    UUID: string;
    PACKAGE_NAME: string;
  };
}

export interface ApiInitConfig {
  username?: string;
  password?: string;
  access_token?: string;
  uid?: number;
}

export interface InitResponse {
  access_token: string;
  uid: number;
}

export interface ApiUser {
  username: string;
  password: string;
  token: string;
  uid: number;
}

// Download Info
export interface DownloadInfo {
  codec: DownloadTrackCodec;
  bitrateInKbps: number;
  downloadInfoUrl: string;
  direct: boolean;
  quality: DownloadTrackQuality;
  gain: boolean;
  preview: boolean;
}

export interface FileInfoResponseNew {
  downloadInfo?: {
    url?: string;
    urls?: string[];
    bitrate?: number;
    quality: string;
    gain?: boolean;
  };
  url?: string;
  urls?: string[];
}

// Track types
export interface Track {
  id: number;
  title: string;
  albums: Array<{ id: number; title?: string }>;
  artists: Array<{ id: number; name: string }>;
  durationMs?: number;
  available?: boolean;
}

export interface GetTrackResponse extends Array<Track> {}

export interface GetTrackSupplementResponse {
  lyrics?: any;
  videos?: any[];
}

export interface GetTrackDownloadInfoResponse extends Array<DownloadInfo> {}

// Album types
export interface Album {
  id: number;
  title: string;
  artists?: Array<{ id: number; name: string }>;
  trackCount?: number;
  year?: number;
  genre?: string;
}

export interface AlbumWithTracks extends Album {
  volumes: Track[][];
}

// Artist types
export interface Artist {
  id: number;
  name: string;
  cover?: any;
}

export interface FilledArtist extends Artist {
  counts?: {
    tracks?: number;
    albums?: number;
  };
  genres?: string[];
  description?: any;
}

export interface ArtistTracksResponse {
  tracks: Track[];
  pager: {
    total: number;
    page: number;
    perPage: number;
  };
}

// Playlist types
export interface Playlist {
  kind: number;
  title: string;
  trackCount?: number;
  owner?: {
    uid: number;
    login: string;
  };
  tracks?: Array<{ track: Track }>;
  revision?: number;
  visibility?: "public" | "private";
}

// Search types
export interface SearchOptions {
  type?: "all" | "artist" | "track" | "album" | "playlist";
  page?: number;
  pageSize?: number;
  nococrrect?: boolean;
}

export interface ConcreteSearchOptions {
  page?: number;
  pageSize?: number;
  nococrrect?: boolean;
}

export interface SearchResponse {
  type: string;
  page: number;
  perPage: number;
  text: string;
}

export interface SearchAllResponse extends SearchResponse {
  tracks?: { results: Track[] };
  albums?: { results: Album[] };
  artists?: { results: Artist[] };
  playlists?: { results: Playlist[] };
}

export interface SearchTracksResponse extends SearchResponse {
  tracks: { results: Track[] };
}

export interface SearchAlbumsResponse extends SearchResponse {
  albums: { results: Album[] };
}

export interface SearchArtistsResponse extends SearchResponse {
  artists: { results: Artist[] };
}

// Other API responses
export interface GetGenresResponse
  extends Array<{ id: string; title: string }> {}

export interface GetFeedResponse {
  generatedPlaylists?: Playlist[];
  days?: any[];
}

export interface GetAccountStatusResponse {
  account: {
    uid: number;
    login: string;
    displayName?: string;
  };
  permissions?: any;
  subscription?: any;
}

export interface DisOrLikedTracksResponse {
  library: {
    tracks: Array<{ id: number; timestamp: string }>;
  };
}

export interface ChartTracksResponse {
  chart: {
    tracks: Track[];
  };
}

export interface NewReleasesResponse {
  newReleases: Album[];
}

export interface NewPlaylistsResponse {
  newPlaylists: Playlist[];
}

export interface PodcastsResponse {
  podcasts: any[];
}

export interface SimilarTracksResponse {
  similarTracks: Track[];
}

// Station types
export interface StationTracksResponse {
  sequence: Array<{ track: Track }>;
  batchId: string;
}

export interface StationInfoResponse {
  station: {
    id: { type: string; tag: string };
    name: string;
  };
}

export interface AllStationsListResponse extends Array<any> {}

export interface RecomendedStationsListResponse {
  stations: any[];
}

// Rotor types
export interface RotorSessionCreateBody {
  seeds: string[];
  includeTracksInResponse?: boolean;
}

export interface RotorSessionCreateResponse {
  radioSessionId: string;
  sequence?: Array<{ track: Track }>;
  batchId?: string;
}

// Queue types
export interface QueuesResponse extends Array<any> {}

export interface QueueResponse {
  id: string;
  context: any;
  tracks: Track[];
}

// URL Extractor
export interface UrlExtractorInterface {
  extractTrackId(url: string): number;
  extractAlbumId(url: string): number;
  extractArtistId(url: string): number;
  extractPlaylistId(url: string): { id: number | string; user: string | null };
}
