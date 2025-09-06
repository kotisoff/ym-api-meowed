import {
  authRequest,
  apiRequest,
  directLinkRequest
} from "./PreparedRequest/index";
import fallbackConfig from "./PreparedRequest/config";
import HttpClient from "./Network/HttpClient";
import { XMLParser } from "fast-xml-parser";
import * as crypto from "crypto";
import {
  ApiConfig,
  ApiInitConfig,
  InitResponse,
  GetGenresResponse,
  SearchResponse,
  Playlist,
  GetTrackResponse,
  Language,
  GetTrackSupplementResponse,
  GetTrackDownloadInfoResponse,
  GetFeedResponse,
  GetAccountStatusResponse,
  Track,
  TrackId,
  ApiUser,
  SearchOptions,
  ConcreteSearchOptions,
  SearchAllResponse,
  SearchArtistsResponse,
  SearchTracksResponse,
  SearchAlbumsResponse,
  AlbumId,
  Album,
  AlbumWithTracks,
  FilledArtist,
  Artist,
  ArtistId,
  ArtistTracksResponse,
  DisOrLikedTracksResponse,
  ChartType,
  ChartTracksResponse,
  NewReleasesResponse,
  NewPlaylistsResponse,
  PodcastsResponse,
  SimilarTracksResponse,
  StationTracksResponse,
  StationInfoResponse,
  AllStationsListResponse,
  RecomendedStationsListResponse,
  QueuesResponse,
  QueueResponse,
  RotorSessionCreateBody,
  RotorSessionCreateResponse
} from "./Types";
import { HttpClientInterface, ObjectResponse } from "./Types/request";
import shortenLink from "./ClckApi";

export default class YMApi {
  private user: ApiUser = {
    password: "",
    token: "",
    uid: 0,
    username: ""
  };

  constructor(
    private httpClient: HttpClientInterface = new HttpClient(),
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
  search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
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

    return this.httpClient.get(request) as Promise<SearchResponse>;
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
  createPlaylist(
    name: string,
    options: { visibility?: "public" | "private" } = {}
  ): Promise<Playlist> {
    const visibility = !options.visibility ? "private" : options.visibility;
    const request = apiRequest()
      .setPath(`/users/${this.user.uid}/playlists/create`)
      .addHeaders(this.getAuthHeader())
      .setBodyData({
        title: name,
        visibility
      });

    return this.httpClient.post(request) as Promise<Playlist>;
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
  getTrack(trackId: TrackId): Promise<GetTrackResponse> {
    const request = apiRequest()
      .setPath(`/tracks/${trackId}`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(request) as Promise<GetTrackResponse>;
  }

  /**
   * GET: /tracks/[track_id]
   * @returns single track
   */
  async getSingleTrack(trackId: TrackId): Promise<Track> {
    const tracks = await this.getTrack(trackId);
    if (tracks.length !== 1) {
      throw new Error(`More than one result received`);
    }

    return tracks.pop() as Track;
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
  getTrackDownloadInfo(
    trackId: TrackId
  ): Promise<GetTrackDownloadInfoResponse> {
    const request = apiRequest()
      .setPath(`/tracks/${trackId}/download-info`)
      .addHeaders(this.getAuthHeader());

    return this.httpClient.get(
      request
    ) as Promise<GetTrackDownloadInfoResponse>;
  }

  /**
   * @returns track direct link
   */
  async getTrackDirectLink(
    trackDownloadUrl: string,
    short: Boolean = false
  ): Promise<string> {
    const request = directLinkRequest(trackDownloadUrl);
    const xml = await this.httpClient.get(request);
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsedXml = parser.parse(xml as string);
    const host = parsedXml["download-info"].host as string;
    const path = parsedXml["download-info"].path as string;
    const ts = parsedXml["download-info"].ts as string;
    const s = parsedXml["download-info"].s as string;
    const sign = crypto
      .createHash("md5")
      .update("XGRlBW9FXlekgbPrRHuSiA" + path.slice(1) + s)
      .digest("hex");
    const link = `https://${host}/get-mp3/${sign}/${ts}${path}`;
    if (short) return await shortenLink(link);
    else return link;
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
      trackid = track;
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
  getAlbum(albumId: AlbumId, withTracks: boolean = false): Promise<Album> {
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
    includeTracksInResponse: boolean = true
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
      .addHeaders({ "content-type": "application/json" })
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
      .addHeaders({ "content-type": "application/json" })
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
}
