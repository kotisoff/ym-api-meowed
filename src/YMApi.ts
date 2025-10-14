import { authRequest, apiRequest, directLinkRequest } from "./PreparedRequest";
import fallbackConfig from "./PreparedRequest/config";
import { HttpClientImproved } from "./Network";
import * as crypto from "crypto";
import { withTimeout, withRetry } from "./utils/timeout";
import {
  type ApiConfig,
  type ApiInitConfig,
  type InitResponse,
  type GetGenresResponse,
  type SearchResponse,
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
  type FileInfoResponseNew
} from "./Types";
import type { HttpClientInterface, ObjectResponse } from "./Types/request";
import shortenLink from "./ClckApi";

export default class YMApi {
  private user: ApiUser = {
    password: "",
    token: "",
    uid: 0,
    username: ""
  };

  private serverOffsetCache: { value: number; timestamp: number } | null = null;
  private readonly SERVER_OFFSET_CACHE_TTL = 300000; // 5 minutes

  constructor(
    private httpClient: HttpClientInterface = new HttpClientImproved(),
    private config: ApiConfig = fallbackConfig
  ) {}

  private getAuthHeader(): { Authorization: string } {
    return {
      Authorization: `OAuth ${this.user.token}`
    };
  }

  private getFakeDeviceHeader(): { "X-Yandex-Music-Device": string } {
    return {
      "X-Yandex-Music-Device":
        "os=unknown; os_version=unknown; manufacturer=unknown; model=unknown; clid=; device_id=unknown; uuid=unknown"
    };
  }

  /**
   * Authentication
   * @returns access_token & uid
   */
  async init(config: ApiInitConfig): Promise<InitResponse> {
    // Skip auth if access_token and uid are present
    if (config.access_token && config.uid) {
      this.user.token = config.access_token;
      this.user.uid = config.uid;
      return {
        access_token: config.access_token,
        uid: config.uid
      };
    }

    if (!config.username || !config.password) {
      throw new Error(
        "username && password || access_token && uid must be set"
      );
    }
    this.user.username = config.username;
    this.user.password = config.password;

    const data = (await this.httpClient.get(
      authRequest().setPath("/token").setQuery({
        grant_type: "password",
        username: this.user.username,
        password: this.user.password,
        client_id: this.config.oauth.CLIENT_ID,
        client_secret: this.config.oauth.CLIENT_SECRET
      })
    )) as ObjectResponse;

    this.user.token = data.access_token;
    this.user.uid = data.uid;

    return data as InitResponse;
  }

  /**
   * GET: /account/status
   * @returns account status for current user
   */
  getAccountStatus(): Promise<GetAccountStatusResponse> {
    const request = apiRequest()
      .setPath("/account/status")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<GetAccountStatusResponse>;
  }

  /**
   * GET: /feed
   * @returns the user's feed
   */
  getFeed(): Promise<GetFeedResponse> {
    const request = apiRequest()
      .setPath("/feed")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<GetFeedResponse>;
  }

  /**
   *
   * @param ChartType Type of chart.
   * GET: /landing3/chart/{ChartType}
   * @returns chart of songs.
   */
  getChart(ChartType: ChartType): Promise<ChartTracksResponse> {
    const request = apiRequest()
      .setPath(`/landing3/chart/${ChartType}`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<ChartTracksResponse>;
  }

  /**
   * GET: /landing3/new-playlists
   * @returns new playlists (for you).
   */
  getNewPlaylists(): Promise<NewPlaylistsResponse> {
    const request = apiRequest()
      .setPath("/landing3/new-playlists")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<NewPlaylistsResponse>;
  }

  /**
   * GET: /landing3/new-releases
   * @returns new releases.
   */
  getNewReleases(): Promise<NewReleasesResponse> {
    const request = apiRequest()
      .setPath("/landing3/new-releases")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<NewReleasesResponse>;
  }

  /**
   * GET: /landing3/podcasts
   * @returns all podcasts.
   */
  getPodcasts(): Promise<PodcastsResponse> {
    const request = apiRequest()
      .setPath("/landing3/podcasts")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<PodcastsResponse>;
  }

  /**
   * GET: /genres
   * @returns a list of music genres
   */
  getGenres(): Promise<GetGenresResponse> {
    const request = apiRequest()
      .setPath("/genres")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<GetGenresResponse>;
  }

  /**
   * GET: /search
   * Search artists, tracks, albums.
   * @returns Every {type} with query in it's title.
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const type = !options.type ? "all" : options.type;
    const page = String(!options.page ? 0 : options.page);
    const nococrrect = String(
      options.nococrrect == null ? false : options.nococrrect
    );
    const request = apiRequest()
      .setPath("/search")
      .addHeaders(this.getAuthHeader())
      .setQuery({
        type,
        text: query,
        page,
        nococrrect
      });

    if (options.pageSize !== void 0) {
      request.addQuery({ pageSize: String(options.pageSize) });
    }

    return await this.httpClient.get(request) as Promise<SearchResponse>;
  }

  /**
   * @param query Query
   * @param options Options
   * @returns Every artist with query in it's title.
   */
  searchArtists(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchArtistsResponse> {
    return this.search(query, {
      ...options,
      type: "artist"
    }) as Promise<SearchArtistsResponse>;
  }

  /**
   * @param query Query
   * @param options Options
   * @returns Every track with query in it's title.
   */
  searchTracks(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchTracksResponse> {
    return this.search(query, {
      ...options,
      type: "track"
    }) as Promise<SearchTracksResponse>;
  }

  /**
   * @param query Query
   * @param options Options
   * @returns Every album with query in it's title.
   */
  searchAlbums(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchAlbumsResponse> {
    return this.search(query, {
      ...options,
      type: "album"
    }) as Promise<SearchAlbumsResponse>;
  }

  /**
   * @param query Query
   * @param options Options
   * @returns Everything with query in it's title.
   */
  searchAll(
    query: string,
    options: ConcreteSearchOptions = {}
  ): Promise<SearchAllResponse> {
    return this.search(query, {
      ...options,
      type: "all"
    }) as Promise<SearchAllResponse>;
  }

  /**
   * GET: /users/[user_id]/playlists/list
   * @returns a user's playlists.
   */
  getUserPlaylists(
    user: number | string | null = null
  ): Promise<Array<Playlist>> {
    const uid = [null, 0, ""].includes(user) ? this.user.uid : user;
    const request = apiRequest()
      .setPath(`/users/${uid}/playlists/list`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<Array<Playlist>>;
  }

  /**
   * GET: /users/[user_id]/playlists/[playlist_kind] when `playlistId` is a number (kind)
   * GET: /playlist/[playlist_uuid] when `playlistId` is a string (UUID)
   * @returns a playlist without tracks
   */
  getPlaylist(
    playlistId: number,
    user?: number | string | null
  ): Promise<Playlist>;
  getPlaylist(playlistId: string): Promise<Playlist>;
  getPlaylist(
    playlistId: number | string,
    user: number | string | null = null
  ): Promise<Playlist> {
    const uid = [null, 0, ""].includes(user) ? this.user.uid : user;
    let request;
    if (typeof playlistId === "number") {
      request = apiRequest()
        .setPath(`/users/${uid}/playlists/${playlistId}`)
        .addHeaders(this.getAuthHeader());
    } else {
      if (playlistId.includes("/playlists/")) {
        playlistId = playlistId.replace("/playlists/", "/playlist/");
      }
      request = apiRequest()
        .setPath(`/playlist/${playlistId}`)
        .addHeaders(this.getAuthHeader())
        .addQuery({ richTracks: "true" });
    }
    return this.httpClient.get(request) as Promise<Playlist>;
  }

  /**
   * GET: /playlist/[playlist_uuid]
   * @returns a playlist without tracks
   */
  // Kept for backward compatibility; now delegates to getPlaylist
  getPlaylistNew(playlistId: string): Promise<Playlist> {
    return this.getPlaylist(playlistId);
  }

  /**
   * GET: /users/[user_id]/playlists
   * @returns an array of playlists with tracks
   */
  getPlaylists(
    playlists: Array<number>,
    user: number | string | null = null,
    options: { mixed?: boolean; "rich-tracks"?: boolean } = {}
  ): Promise<Array<Playlist>> {
    const uid = [null, 0, ""].includes(user) ? this.user.uid : user;
    const kinds = playlists.join();
    const mixed = String(options.mixed == null ? false : options.mixed);
    const richTracks = String(
      options["rich-tracks"] == null ? false : options["rich-tracks"]
    );

    const request = apiRequest()
      .setPath(`/users/${uid}/playlists`)
      .addHeaders(this.getAuthHeader())
      .setQuery({
        kinds,
        mixed,
        "rich-tracks": richTracks
      });

    return this.httpClient.get(request) as Promise<Array<Playlist>>;
  }

  /**
   * POST: /users/[user_id]/playlists/create
   * Create a new playlist
   * @returns Playlist
   */
  async createPlaylist(
    name: string,
    options: { visibility?: "public" | "private" } = {}
  ): Promise<Playlist> {
    if (!name) throw new Error("Playlist name is required");

    const visibility = options.visibility ?? "private"; // default to private

    const request = apiRequest()
      .setPath(`/users/${this.user.uid}/playlists/create`)
      .addHeaders(this.getAuthHeader())
      .addHeaders({ "content-type": "application/x-www-form-urlencoded" })
      .setBodyData({
        title: name,
        visibility
      });

    return await this.httpClient.post(request) as Promise<Playlist>;
  }

  /**
   * POST: /users/[user_id]/playlists/[playlist_kind]/delete
   * Remove a playlist
   * @returns "ok" | string
   */
  removePlaylist(playlistId: number): Promise<"ok" | string> {
    const request = apiRequest()
      .setPath(`/users/${this.user.uid}/playlists/${playlistId}/delete`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.post(request) as Promise<"ok" | string>;
  }

  /**
   * POST: /users/[user_id]/playlists/[playlist_kind]/name
   * Change playlist name
   * @returns Playlist
   */
  renamePlaylist(playlistId: number, name: string): Promise<Playlist> {
    const request = apiRequest()
      .setPath(`/users/${this.user.uid}/playlists/${playlistId}/name`)
      .addHeaders(this.getAuthHeader())
      .setBodyData({
        value: name
      });

    return this.httpClient.post(request) as Promise<Playlist>;
  }

  /**
   * POST: /users/[user_id]/playlists/[playlist_kind]/change-relative
   * Add tracks to the playlist
   * @returns Playlist
   */
  addTracksToPlaylist(
    playlistId: number,
    tracks: Array<{ id: number; albumId: number }>,
    revision: number,
    options: { at?: number } = {}
  ): Promise<Playlist> {
    const at = !options.at ? 0 : options.at;
    const request = apiRequest()
      .setPath(
        `/users/${this.user.uid}/playlists/${playlistId}/change-relative`
      )
      .addHeaders(this.getAuthHeader())
      .addHeaders({ "content-type": "application/x-www-form-urlencoded" })
      .setBodyData({
        diff: JSON.stringify([
          {
            op: "insert",
            at,
            tracks: tracks
          }
        ]),
        revision: String(revision)
      });

    return this.httpClient.post(request) as Promise<Playlist>;
  }

  /**
   * POST: /users/[user_id]/playlists/[playlist_kind]/change-relative
   * Remove tracks from the playlist
   * @returns Playlist
   */
  removeTracksFromPlaylist(
    playlistId: number,
    tracks: Array<{ id: number; albumId: number }>,
    revision: number,
    options: { from?: number; to?: number } = {}
  ): Promise<Playlist> {
    const from = !options.from ? 0 : options.from;
    const to = !options.to ? tracks.length : options.to;
    const request = apiRequest()
      .setPath(
        `/users/${this.user.uid}/playlists/${playlistId}/change-relative`
      )
      .addHeaders(this.getAuthHeader())
      .setBodyData({
        diff: JSON.stringify([
          {
            op: "delete",
            from,
            to,
            tracks
          }
        ]),
        revision: String(revision)
      });

    return this.httpClient.post(request) as Promise<Playlist>;
  }

  /**
   * GET: /tracks/[track_id]
   * @returns an array of playlists with tracks
   */
  async getTrack(trackId: TrackId): Promise<GetTrackResponse> {
    const request = apiRequest()
      .setPath(`/tracks/${trackId}`)
      .addHeaders(this.getAuthHeader())
      .addHeaders({ "content-type": "application/json" });

    return await this.httpClient.get(request) as Promise<GetTrackResponse>;
  }

  /**
   * GET: /tracks/[track_id]
   * @returns single track
   */
  async getSingleTrack(trackId: TrackId): Promise<Track> {
    const tracks = await this.getTrack(trackId);

    if (!tracks || tracks.length === 0) {
      throw new Error(`No track found for ID ${trackId}`);
    }

    return tracks[0];
  }

  /**
   * GET: /tracks/[track_id]/supplement
   * @returns an array of playlists with tracks
   */
  getTrackSupplement(trackId: TrackId): Promise<GetTrackSupplementResponse> {
    const request = apiRequest()
      .setPath(`/tracks/${trackId}/supplement`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<GetTrackSupplementResponse>;
  }

  /**
   * GET: /tracks/[track_id]/download-info
   * @returns track download information
   */
  async getTrackDownloadInfo(
    trackId: TrackId,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless,
    canUseStreaming = true
  ): Promise<GetTrackDownloadInfoResponse> {
    const ts = Math.floor(Date.now() / 1000);
    const sign = this.generateTrackSignature(ts, String(trackId), quality);
    const request = apiRequest()
      .setPath(`/tracks/${trackId}/download-info`)
      .addHeaders(this.getAuthHeader())
      .addQuery({
        ts: String(ts),
        can_use_streaming: String(canUseStreaming),
        sign
      });

    return await this.httpClient.get(request) as GetTrackDownloadInfoResponse;
  }

  async getTrackDownloadInfoNew(
    trackId: number,
    quality: DownloadTrackQuality = DownloadTrackQuality.Lossless,
  ): Promise<FileInfoResponseNew> {
    if (!this.user.token) throw new Error("User token is missing");
    const offset = await this.getYandexServerOffset();
    const ts = Math.floor(Date.now() / 1000 + offset);
    const sign = this.generateTrackSignature(ts, String(trackId), quality);
    const request = apiRequest()
      .setPath("/get-file-info")
      .addHeaders(this.getAuthHeader())
      .addQuery({
        ts: String(ts),
        trackId: String(trackId),
        quality,
        codecs: "flac,aac,he-aac,mp3",
        transports: "raw",
        sign
      });

    return await this.httpClient.get(request) as FileInfoResponseNew;
  }

  /**
   * @returns track direct link
   */
  async getTrackDirectLink(
    trackDownloadUrl: string,
    short = false
  ): Promise<string> {
    const request = directLinkRequest(trackDownloadUrl);

    const parsedXml = (await this.httpClient.get(request)) as any;

    const downloadInfo = parsedXml["download-info"];
    if (!downloadInfo) throw new Error("Download info missing in response");

    const host = downloadInfo.host as string;
    const path = downloadInfo.path as string;
    const ts = downloadInfo.ts as string;
    const s = downloadInfo.s as string;

    const sign = crypto
      .createHash("md5")
      .update("XGRlBW9FXlekgbPrRHuSiA" + path.slice(1) + s)
      .digest("hex");

    const link = `https://${host}/get-mp3/${sign}/${ts}${path}`;
    return short ? await shortenLink(link) : link;
  }

  async getTrackDirectLinkNew(trackUrl: string): Promise<string> {
    return `${trackUrl}`;
  }

  extractTrackId(url: string): string {
    // пример: https://music.yandex.ru/album/14457044/track/25063569
    const match = url.match(/\/track\/(\d+)/);
    if (!match) throw new Error("Invalid Yandex Music track URL");
    return match[1];
  }

  /**
   * @returns track sharing link
   */
  async getTrackShareLink(track: TrackId | Track): Promise<string> {
    let albumid = 0,
      trackid = 0;
    if (typeof track === "object") {
      albumid = track.albums[0].id;
      trackid = track.id;
    } else {
      albumid = (await this.getSingleTrack(track)).albums[0].id;
      trackid = Number(track);
    }
    return `https://music.yandex.ru/album/${albumid}/track/${trackid}`;
  }

  /**
   * GET: /tracks/{track_id}/similar
   * @returns simmilar tracks
   */
  getSimilarTracks(trackId: TrackId): Promise<SimilarTracksResponse> {
    const request = apiRequest()
      .setPath(`/tracks/${trackId}/similar`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<SimilarTracksResponse>;
  }

  /**
   * GET: /albums/[album_id]
   * @returns an album
   */
  getAlbum(albumId: AlbumId, withTracks = false): Promise<Album> {
    const request = apiRequest()
      .setPath(`/albums/${albumId}${withTracks ? "/with-tracks" : ""}`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<Album>;
  }

  getAlbumWithTracks(albumId: AlbumId): Promise<AlbumWithTracks> {
    return this.getAlbum(albumId, true) as Promise<AlbumWithTracks>;
  }

  /**
   * GET: /albums
   * @returns an albums
   */
  getAlbums(albumIds: Array<AlbumId>): Promise<Array<Album>> {
    const request = apiRequest()
      .setPath(`/albums`)
      .setBodyData({ albumIds: albumIds.join() })
      .addHeaders(this.getAuthHeader());

    return this.httpClient.post(request) as Promise<Array<Album>>;
  }

  /**
   * GET: /artists/[artist_id]
   * @returns an artist
   */
  getArtist(artistId: ArtistId): Promise<FilledArtist> {
    const request = apiRequest()
      .setPath(`/artists/${artistId}`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<FilledArtist>;
  }

  /**
   * GET: /artists
   * @returns an artists
   */
  getArtists(artistIds: Array<ArtistId>): Promise<Array<Artist>> {
    const request = apiRequest()
      .setPath(`/artists`)
      .setBodyData({ artistIds: artistIds.join() })
      .addHeaders(this.getAuthHeader());

    return this.httpClient.post(request) as Promise<Array<Artist>>;
  }

  /**
   * GET: /artists/[artist_id]/tracks
   * @returns Tracks by artist id
   */
  getArtistTracks(
    artistId: ArtistId,
    options: SearchOptions = {}
  ): Promise<ArtistTracksResponse> {
    const page = String(!options.page ? 0 : options.page);
    const request = apiRequest()
      .setPath(`/artists/${artistId}/tracks`)
      .addHeaders(this.getAuthHeader())
      .setQuery({
        page
      });

    if (options.pageSize !== void 0) {
      request.addQuery({ pageSize: String(options.pageSize) });
    }

    return this.httpClient.get(request) as Promise<ArtistTracksResponse>;
  }

  /**
   * GET: /users/{userId}/likes/tracks
   * @param userId User id. Nullable.
   * @returns Liked Tracks
   */

  getLikedTracks(
    userId: number | string | null = null
  ): Promise<DisOrLikedTracksResponse> {
    const uid = [null, 0, ""].includes(userId) ? this.user.uid : userId;
    const request = apiRequest()
      .setPath(`/users/${uid}/likes/tracks`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<DisOrLikedTracksResponse>;
  }

  /**
   * GET: /users/{userId}/dislikes/tracks
   * @param userId User id. Nullable.
   * @returns Disliked Tracks
   */

  getDislikedTracks(
    userId: number | string | null = null
  ): Promise<DisOrLikedTracksResponse> {
    const uid = [null, 0, ""].includes(userId) ? this.user.uid : userId;
    const request = apiRequest()
      .setPath(`/users/${uid}/dislikes/tracks`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<DisOrLikedTracksResponse>;
  }

  /**
   * GET: /rotor/stations/list
   * @param language Language of station list
   * @returns list of stations.
   */
  getAllStationsList(language?: Language): Promise<AllStationsListResponse> {
    const request = apiRequest()
      .setPath(`/rotor/stations/list`)
      .addHeaders(this.getAuthHeader())
      .setQuery(language ? { language } : {});

    return this.httpClient.get(request) as Promise<AllStationsListResponse>;
  }

  /**
   * GET: /rotor/stations/dashboard
   * REQUIRES YOU TO BE LOGGED IN!
   * @returns list of recomended stations.
   */
  getRecomendedStationsList(): Promise<RecomendedStationsListResponse> {
    const request = apiRequest()
      .setPath("/rotor/stations/dashboard")
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(
      request
    ) as Promise<RecomendedStationsListResponse>;
  }

  /**
   * GET: /rotor/station/{stationId}/tracks
   * REQUIRES YOU TO BE LOGGED IN!
   * @param stationId Id of station. Example: user:onyourwave
   * @param queue Unique id of prev track.
   * @returns tracks from station.
   */
  getStationTracks(
    stationId: string,
    queue?: string
  ): Promise<StationTracksResponse> {
    const request = apiRequest()
      .setPath(`/rotor/station/${stationId}/tracks`)
      .addHeaders(this.getAuthHeader())
      .addQuery(queue ? { queue } : {});
    return this.httpClient.get(request) as Promise<StationTracksResponse>;
  }

  /**
   * GET: /rotor/station/{stationId}/info
   * @param stationId Id of station. Example: user:onyourwave
   * @returns info of the station.
   */
  getStationInfo(stationId: string): Promise<StationInfoResponse> {
    const request = apiRequest()
      .setPath(`/rotor/station/${stationId}/info`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<StationInfoResponse>;
  }

  /**
   * POST: /rotor/session/new
   * @param seeds array of station ids e.g. ["user:onyourwave"]
   * @param includeTracksInResponse whether to include tracks in response
   */
  createRotorSession(
    seeds: Array<string>,
    includeTracksInResponse = true
  ): Promise<RotorSessionCreateResponse> {
    const body: RotorSessionCreateBody = {
      seeds,
      ...(includeTracksInResponse !== undefined
        ? { includeTracksInResponse }
        : {})
    };

    const request = apiRequest()
      .setPath(`/rotor/session/new`)
      .addHeaders(this.getAuthHeader())
      .setBodyData(body as unknown as any);

    return this.httpClient.post(request) as Promise<RotorSessionCreateResponse>;
  }

  /**
   * POST: /rotor/session/{sessionId}/tracks
   * Retrieves the next batch of tracks within an existing session
   * @param sessionId The ID of the active session (radioSessionId)
   * @param options Object containing optional parameters such as queue (previous track ID), batchId, etc.
   */
  postRotorSessionTracks(
    sessionId: string,
    options?: {
      queue?: string[];
      batchId?: string;
    }
  ): Promise<RotorSessionCreateResponse> {
    const body = {
      ...(options?.queue ? { queue: options.queue } : {}),
      ...(options?.batchId ? { batchId: options.batchId } : {})
    };

    const request = apiRequest()
      .setPath(`/rotor/session/${sessionId}/tracks`)
      .addHeaders(this.getAuthHeader())
      .setBodyData(body as unknown as any);

    return this.httpClient.post(request) as Promise<RotorSessionCreateResponse>;
  }

  /**
   * GET: /queues
   * @returns queues without tracks
   */

  getQueues(): Promise<QueuesResponse> {
    const request = apiRequest()
      .setPath("/queues")
      .addHeaders(this.getFakeDeviceHeader())
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<QueuesResponse>;
  }

  /**
   * GET: /queues/{queueId}
   * @param queueId Queue id.
   * @returns queue data with(?) tracks.
   */

  getQueue(queueId: string): Promise<QueueResponse> {
    const request = apiRequest()
      .setPath(`/queues/${queueId}`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<QueueResponse>;
  }

  /**
   * Get Yandex server time offset with caching
   * @param retries Number of retry attempts
   * @param timeoutMs Timeout in milliseconds
   * @returns Server time offset in seconds
   */
  private async getYandexServerOffset(
    retries = 3,
    timeoutMs = 2000
  ): Promise<number> {
    if (this.serverOffsetCache) {
      const age = Date.now() - this.serverOffsetCache.timestamp;
      if (age < this.SERVER_OFFSET_CACHE_TTL) {
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
        clearTimeout(timeoutId);

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
      return 0; // fallback to no offset
    }
  }

  /**
   * Generate signature for track download
   */
  private generateTrackSignature(
    ts: number,
    trackId: string,
    quality: string
  ): string {
    const codecs = "flacaache-aacmp3";
    const transports = "raw";
    const signBase = `${ts}${trackId}${quality}${codecs}${transports}`;
    const key = "kzqU4XhfCaY6B6JTHODeq5";

    return Buffer.from(
      crypto.createHmac("sha256", key).update(signBase).digest()
    )
      .toString("base64")
      .replace(/=+$/, "");
  }
}